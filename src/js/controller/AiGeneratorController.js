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
     * Finds the container element and sets up event listeners for the buttons.
     */
    ns.AiGeneratorController.prototype.init = function () {
        this.container = document.querySelector('.ai-generator-container');

        if (!this.container) {
            // If the container is not found, do not initialize the controller.
            return;
        }

        this.positivePromptEl = this.container.querySelector('#ai-positive-prompt');
        this.initButtons_();
    };

    /**
     * Finds all buttons with the '.ai-generator-button' class and attaches
     * the click event listener to them.
     * @private
     */
    ns.AiGeneratorController.prototype.initButtons_ = function () {
        var buttons = this.container.querySelectorAll('.ai-generator-button');
        buttons.forEach(function(button) {
            button.addEventListener('click', this.onButtonClick_.bind(this));
        }.bind(this));
    };

    /**
     * Handles all button clicks within the AI Generator panel.
     * It checks the 'data-action' attribute of the clicked button to decide what to do.
     * @param {Event} event The click event.
     * @private
     */
    ns.AiGeneratorController.prototype.onButtonClick_ = function (event) {
        var action = event.currentTarget.dataset.action;

        if (action === 'toggle-detail') {
            console.log("'+ Detail' button clicked, attempting to open dialog...");
            $.publish(Events.DIALOG_SHOW, {
                dialogId: 'pixel-on-detail'
            });
        } else if (action === 'generate') {
            this.generateAndMoveToFrame_();
        }
    };

    ns.AiGeneratorController.prototype.generateAndMoveToFrame_ = function () {
        var positivePrompt = this.positivePromptEl.value;
        if (!positivePrompt) {
            console.error("Positive prompt is empty.");
            return;
        }

        var currentPiskel = this.piskelController.getPiskel();
        var spec = {
            p_prompt: positivePrompt,
            n_prompt: "",
            width: currentPiskel.width,
            height: currentPiskel.height,
            generateCount: 1
        };

        // 1. Create a new session
        var newSession = new pskl.model.pixelOn.AiSession(spec.p_prompt, spec);
        this.pixelOnController.addSession(newSession);

        // 2. Simulate image generation and get the result
        // In a real scenario, this would be an API call.
        // We'll use a placeholder image for now.
        var sampleImage = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAABoElEQVR4AeyV4XIDIQiE2T55++TXXaKJXkG8dm76J46oKCyfJpN82D+3N0D2Agc/GRmne3sGYMfh9TXIbqNIAVSxQfhSwx22BFDBAULuXyx8yRJAFRtEKKDzDUtzUwAAZl9p3kbNZwj5c50MgNWbQIOgijZyJZ3+NKYdBrzkziEZgOKAz9WxVc2LD68YUuxVaK9QVRzOn8XxuERY3NgqgNcrEIKqTLGDQ2UMMcOjuK1aBaDcF4Q8mkAi45F3nQF+aQ0y34+GHQDPQ7uNxC1p/QxY1pyytwG6+JQdOIqTBUfh1jZAmL3YbBD9u5JG7gBQSzqpRnrAxPFPLYzbAZgSAYQ/LEC8PyUHTgXAS/zu9mMtisgNhSoAJU4mMdm0SUd7Mi4v9csAl9Q3gt8AqxfgRzp/bwBMjwqs/R4MeJwPfa/PK4AeszUDoX6ZexkAgP8OAHBxAO7L4ZNpmgzA5J+dFQDYpngVWNkUTGfITylWAJSw5+2saCp2NqaosIzLuFcASqYuHISLdKY8AuPWulcAPTsSP+/12EvzLsAl0TG4Wn8DAAD//1SS+kMAAAAGSURBVAMAarinQckpiIkAAAAASUVORK5CYII=";
        
        var imageUuid = this.pixelOnController.addImage(sampleImage, spec);
        newSession.addImageUuid(imageUuid);

        // 3. Create a new frame in Piskel from the generated image
        pskl.utils.FrameUtils.createFromImageSrc(sampleImage, false, function(frame) {
            this.piskelController.addFrameAtCurrentIndex();
            var targetFrame = this.piskelController.getCurrentFrame();
            targetFrame.setPixels(frame.pixels);

            // Save the state for undo/redo
            $.publish(Events.PISKEL_SAVE_STATE, {
                type: pskl.service.HistoryService.SNAPSHOT
            });
        }.bind(this));
    };
})();
