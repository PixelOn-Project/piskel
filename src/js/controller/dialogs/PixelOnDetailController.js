(function () {
  var ns = $.namespace('pskl.controller.dialogs');

  ns.PixelOnDetailController = function (piskelController, args) {
    this.piskelController = piskelController;
    this.args = args;
  };

  pskl.utils.inherit(ns.PixelOnDetailController, pskl.controller.dialogs.AbstractDialogController);

  ns.PixelOnDetailController.prototype.init = function () {
    // Find the root element of this specific dialog using its unique data-dialog-id.
    // This is the correct way to set up the container for a dialog controller.
    this.container = document.querySelector('[data-dialog-id="pixel-on-detail"]');

    // Now that this.container is correctly defined, we can find elements within it.
    var closeButton = this.container.querySelector('.dialog-close');
    this.addEventListener(closeButton, 'click', this.closeDialog);

    var cancelButton = this.container.querySelector('.cancel-button');
    this.addEventListener(cancelButton, 'click', this.closeDialog);
  };

})();
