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

        // If the action is 'toggle-detail', it means the user clicked the '+ Detail' button.
        // We publish a DIALOG_SHOW event, which is the standard way in Piskel to request
        // a dialog (modal) to be opened. The DialogsController will listen for this event.
        if (action === 'toggle-detail') {
            console.log("'+ Detail' button clicked, attempting to open dialog...");
            $.publish(Events.DIALOG_SHOW, {
                dialogId: 'pixel-on-detail' // This ID will be used to identify which dialog to open.
            });
        }
    };
})();
