/**
 * @require Events
 */
(function () {
    var ns = $.namespace('pskl.controller');

    /**
     * AI Generator Controller
     * Handles user interactions within the AI Generator panel.
     */
    ns.AiGeneratorController = function (piskelController) {
        this.piskelController = piskelController;
        this.pixelOnController = pskl.app.pixelOnController;
    };

    /**
     * Initializes the controller.
     */
    ns.AiGeneratorController.prototype.init = function () {
        this.container = document.querySelector('.ai-generator-container');
        if (!this.container) return;

        this.positivePromptContainer = this.container.querySelector('#ai-positive-prompt');
        this.positivePromptInput = this.positivePromptContainer.querySelector('.tag-input');
        this.statusTextEl = this.container.querySelector('.status-text');
        this.generateButton = this.container.querySelector('[data-action="generate"]');

        this.BASE_URL = 'http://127.0.0.1:5000';
        this.isGenerating = false;
        this.abortController = null;

        this.initButtons_();
        this.initTagInput_();
    };

    /**
     * Attaches click event listeners to the buttons.
     */
    ns.AiGeneratorController.prototype.initButtons_ = function () {
        var buttons = this.container.querySelectorAll('.ai-generator-button');
        buttons.forEach(function(button) {
            button.addEventListener('click', this.onButtonClick_.bind(this));
        }.bind(this));
    };

    ns.AiGeneratorController.prototype.initTagInput_ = function () {
        this.positivePromptInput.addEventListener('keydown', this.onTagInputKeyDown_.bind(this, this.positivePromptContainer));
        this.positivePromptContainer.addEventListener('click', this.onTagContainerClick_.bind(this));
    };

    /**
     * Handles all button clicks within the panel.
     */
    ns.AiGeneratorController.prototype.onButtonClick_ = function (event) {
        var action = event.currentTarget.dataset.action;

        if (action === 'toggle-detail') {
            $.publish(Events.DIALOG_SHOW, { dialogId: 'pixel-on-detail' });
        } else if (action === 'generate') {
            if (this.isGenerating) {
                this.stopGeneration_();
            } else {
                this.startGeneration_();
            }
        }
    };

    /**
     * Starts the image generation process.
     */
    ns.AiGeneratorController.prototype.startGeneration_ = async function () {
        var positivePrompt = this.getTagsAsString_(this.positivePromptContainer);
        if (!positivePrompt) {
            this.updateUiForGenerationState_(false, 'Prompt is empty.');
            return;
        }

        var currentPiskel = this.piskelController.getPiskel();
        var spec = {
            p_prompt: positivePrompt,
            n_prompt: "",
            width: currentPiskel.width,
            height: currentPiskel.height,
            count: 1
        };

        var session = new pskl.model.pixelOn.AiSession(spec.p_prompt, spec);
        this.pixelOnController.addSession(session);

        this.abortController = new AbortController();
        this.updateUiForGenerationState_(true, 'Connecting...');

        try {
            const response = await fetch(`${this.BASE_URL}/api/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ session_id: session.getUuid(), spec: spec }),
                signal: this.abortController.signal
            });

            if (!response.ok) throw new Error(`Server error: ${response.status}`);

            await this.processStream_(response.body, session);
        } catch (error) {
            if (error.name === 'AbortError') {
                this.updateUiForGenerationState_(false, 'Cancelled.');
            } else {
                this.updateUiForGenerationState_(false, `Error: ${error.message}`);
            }
        }
    };

    /**
     * Stops the image generation process.
     */
    ns.AiGeneratorController.prototype.stopGeneration_ = async function () {
        if (this.abortController) {
            this.abortController.abort();
        }
    };

    /**
     * Processes the SSE stream from the server.
     */
    ns.AiGeneratorController.prototype.processStream_ = async function (stream, session) {
        const reader = stream.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const events = buffer.split('\n\n');
            buffer = events.pop();

            for (const event of events) {
                if (event.startsWith('data:')) {
                    this.handleSseEvent_(event.substring(5).trim(), session);
                }
            }
        }
    };

    /**
     * Handles individual SSE events.
     */
    ns.AiGeneratorController.prototype.handleSseEvent_ = function (eventData, session) {
        try {
            const data = JSON.parse(eventData);
            switch (data.type) {
                case 'image':
                    this.updateUiForGenerationState_(true, `Generating... (${data.current_index}/${data.total_count})`);
                    this.onImageReceive_(data, session);
                    break;
                case 'done':
                    this.updateUiForGenerationState_(false, 'Finished.');
                    break;
                case 'error':
                    this.updateUiForGenerationState_(false, `Error: ${data.message}`);
                    break;
            }
        } catch (e) {
            console.error('Failed to parse SSE event:', eventData, e);
        }
    };

    /**
     * Handles a received image, adds it to the session, and creates a new frame in Piskel.
     */
    ns.AiGeneratorController.prototype.onImageReceive_ = function(data, session) {
        const fullBase64 = `data:image/png;base64,${data.image_base64}`;
        const imgUuid = this.pixelOnController.addImage(fullBase64, data.spec);
        session.addImageUuid(imgUuid);

        // Immediately create a new frame with the generated image
        pskl.utils.FrameUtils.createFromImageSrc(fullBase64, false, function(frame) {
            this.piskelController.addFrameAtCurrentIndex();
            var targetFrame = this.piskelController.getCurrentFrame();
            targetFrame.setPixels(frame.pixels);
            $.publish(Events.PISKEL_SAVE_STATE, { type: pskl.service.HistoryService.SNAPSHOT });
        }.bind(this));
    };

    /**
     * Updates the UI to reflect the current generation state.
     */
    ns.AiGeneratorController.prototype.updateUiForGenerationState_ = function(isGenerating, statusMessage) {
        this.isGenerating = isGenerating;
        this.statusTextEl.textContent = statusMessage || '';
        if (isGenerating) {
            this.generateButton.textContent = 'Stop';
            this.generateButton.classList.add('stop-button');
        } else {
            this.generateButton.textContent = 'Generate';
            this.generateButton.classList.remove('stop-button');
        }
    };

    // =================================================================
    //                            Tag Management
    // =================================================================

    ns.AiGeneratorController.prototype.onTagInputKeyDown_ = function (container, event) {
        var input = event.target;
        if (event.key === 'Enter') {
            event.preventDefault();
            var text = input.value.trim();
            if (text) {
                this.addTag_(container, text);
                input.value = '';
            }
        } else if (event.key === 'Backspace' && input.value === '') {
            var lastTag = input.previousElementSibling;
            if (lastTag && lastTag.classList.contains('tag-item')) {
                this.removeTag_(lastTag);
            }
        }
    };

    ns.AiGeneratorController.prototype.onTagContainerClick_ = function (event) {
        if (event.target.classList.contains('tag-remove-button')) {
            this.removeTag_(event.target.parentElement);
        } else if (event.target.classList.contains('tag-input-container')) {
            event.target.querySelector('.tag-input').focus();
        }
    };

    ns.AiGeneratorController.prototype.addTag_ = function (container, text) {
        var tagItem = document.createElement('div');
        tagItem.className = 'tag-item';
        tagItem.textContent = text;

        var removeButton = document.createElement('button');
        removeButton.className = 'tag-remove-button';
        removeButton.innerHTML = '&times;';
        tagItem.appendChild(removeButton);

        var input = container.querySelector('.tag-input');
        container.insertBefore(tagItem, input);
    };

    ns.AiGeneratorController.prototype.removeTag_ = function (tagElement) {
        tagElement.parentElement.removeChild(tagElement);
    };

    ns.AiGeneratorController.prototype.getTagsAsString_ = function (container) {
        var tags = [];
        container.querySelectorAll('.tag-item').forEach(tagElement => {
            tags.push(tagElement.firstChild.textContent.trim());
        });
        return tags.join(', ');
    };
})();
