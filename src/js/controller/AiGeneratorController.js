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
        this.sdController = pskl.app.sdController; // Get SDController instance
        this.callbackId = 'ai-generator'; // Unique ID for callbacks
        this.currentSessionId = null; // To keep track of the session initiated by this controller
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

        this.isGenerating = false; // This will be managed by SDController's state

        // Register callbacks with SDController
        this.sdController.registerCallbacks(this.callbackId, {
            onProgress: this.updateUiForGenerationState_.bind(this),
            onImage: this.onImageReceive_.bind(this),
            onError: this.onGenerationError_.bind(this)
        });

        this.initButtons_();
        this.initTagInput_();

        // Optional: Add a mechanism to unregister callbacks when the controller is destroyed.
        // For simplicity, we'll leave it for now as this controller is long-lived.
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
                // Stop generation only if it was started by this controller
                if (this.currentSessionId) {
                    this.sdController.stop(this.currentSessionId);
                }
            } else {
                // Start generation
                this.startGeneration_();
            }
        }
    };

    /**
     * Starts the image generation process by calling the SDController.
     */
    ns.AiGeneratorController.prototype.startGeneration_ = function () {
        var positivePrompt = this.getTagsAsString_(this.positivePromptContainer);
        if (!positivePrompt) {
            this.updateUiForGenerationState_(false, 'Prompt is empty.');
            return;
        }

        var currentPiskel = this.piskelController.getPiskel();
        var spec = {
            p_prompt: positivePrompt,
            n_prompt: "", // No negative prompt in the simple view
            width: currentPiskel.width,
            height: currentPiskel.height,
            count: 1,
            presset: 'normal' // Always use 'normal' preset for the simple generator
        };

        // Create a temporary session for this generation
        var session = new pskl.model.pixelOn.AiSession(spec.p_prompt, spec);
        this.pixelOnController.addSession(session);
        this.currentSessionId = session.getUuid();

        // Call the central controller to handle the API call
        this.sdController.generate(spec, this.currentSessionId);
    };

    /**
     * Handles a received image, adds it to the session, and creates a new frame in Piskel.
     * This is a callback executed by the SDController.
     */
    ns.AiGeneratorController.prototype.onImageReceive_ = function(data) {
        // Only process the image if it belongs to the session started by this controller
        if (data.session_id !== this.currentSessionId) {
            return;
        }

        // The image is already saved in the model by SDController.
        // We just need to create the frame.
        const imageData = this.pixelOnController.getImage(data.imgUuid);
        if (!imageData) return;

        // Immediately create a new frame with the generated image
        pskl.utils.FrameUtils.createFromImageSrc(imageData.image, false, function(frame) {
            this.piskelController.addFrameAtCurrentIndex();
            var targetFrame = this.piskelController.getCurrentFrame();
            targetFrame.setPixels(frame.pixels);
            $.publish(Events.PISKEL_SAVE_STATE, { type: pskl.service.HistoryService.SNAPSHOT });
        }.bind(this));
    };

    ns.AiGeneratorController.prototype.onGenerationError_ = function(errorMessage) {
        // The onProgress callback already updates the UI status text.
        // We can log the error for debugging.
        console.error("Generation Error reported to AiGeneratorController:", errorMessage);
    };

    /**
     * Updates the UI to reflect the current generation state.
     * This is a callback executed by the SDController.
     */
    ns.AiGeneratorController.prototype.updateUiForGenerationState_ = function(isGenerating, statusMessage, sessionId) {
        this.isGenerating = isGenerating;

        if (isGenerating) {
            // Check if the generation was started by this controller or another (e.g., the modal)
            if (sessionId && this.currentSessionId === sessionId) {
                // Generation started by this controller
                this.statusTextEl.textContent = statusMessage || '';
                this.generateButton.textContent = 'Stop';
                this.generateButton.classList.add('stop-button');
            } else {
                // Generation started elsewhere (in the modal)
                this.statusTextEl.textContent = 'Generating in Modal...';
                // Do not change the button state, as it doesn't control this generation process
            }
        } else {
            // Generation finished or was stopped
            this.statusTextEl.textContent = statusMessage || '';
            this.generateButton.textContent = 'Generate';
            this.generateButton.classList.remove('stop-button');
            // Reset session ID when generation is finished or stopped
            this.currentSessionId = null;
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
