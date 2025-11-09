(function () {
  var ns = $.namespace('pskl.controller.dialogs');
  
  // sigleton instance
  var instance = null;

  ns.PixelOnDetailController = function (piskelController, args) {
    this.piskelController = piskelController;
    // PixelOn 관련 서비스 및 컨트롤러 초기화
    var pixelOn = new pskl.model.PixelOn(256, 256, 8);
    this.pixelOnController = new pskl.controller.PixelOnController(pixelOn);
    this.pixelOnController.init(pixelOn.getWidth(), pixelOn.getHeight(), 8);
    this.args = args;
  };

  pskl.utils.inherit(ns.PixelOnDetailController, pskl.controller.dialogs.AbstractDialogController);

  ns.PixelOnDetailController.getInstance = function (piskelController) {
    if (!ns.PixelOnDetailController.instance) {
      instance = new ns.PixelOnDetailController(piskelController);
    }
    return instance;
  };

  ns.PixelOnDetailController.prototype.init = function () {
    // Find the root element of this specific dialog using its unique data-dialog-id.
    // This is the correct way to set up the container for a dialog controller.
    this.container = document.querySelector('[data-dialog-id="pixel-on-detail"]');
    this.isShow_ = true

    // DOM Element References
    this.historyListEl = this.container.querySelector('.history-list');
    this.createSessionButton = this.container.querySelector('.generate-button');
    this.positivePromptEl = this.container.querySelector('.positive-prompt');
    this.negativePromptEl = this.container.querySelector('.negative-prompt');
    this.widthInputEl = this.container.querySelector('.resolution-input[data-param="width"]');
    this.heightInputEl = this.container.querySelector('.resolution-input[data-param="height"]');
    this.countInputEl = this.container.querySelector('.count-input');
    this.generateButton = this.container.querySelector('.generate-button');
    this.resultsTitleEl = this.container.querySelector('.results-title');
    this.resultsContentEl = this.container.querySelector('.result-section');
    this.exportButton = this.container.querySelector('.export-button');
    this.statusTextEl = this.container.querySelector('.status-text');
    this.dialogWrapper = this.container.parentNode.parentNode;

    // paletteList 객체 옮겨오기 (toolbox-container palettes-list-container)
    this.paletteArea = document.querySelector('.prompt-column .palette-area')
    this.paletteContainer = document.getElementById("palettes-list-container")
    this.originalParent = this.paletteContainer.parentNode;
    this.originalNextSibling = this.paletteContainer.nextSibling
    
    // paletteList 객체 적용하기
    this.paletteArea.appendChild(this.paletteContainer)

    // ADD EventListener
    // --- Event Listeners ---
    this.addEventListener(this.dialogWrapper, 'click', this.onCloseFuncs_, true) // 최우선 실행
    this.addEventListener(this.createSessionButton, 'click', this.onCreateSessionClick_);
    this.addEventListener(this.generateButton, 'click', this.onGenerateClick_);
    this.addEventListener(this.exportButton, 'click', this.onExportClick_);

    // Now that this.container is correctly defined, we can find elements within it.
    var closeButton = this.container.querySelector('.dialog-close');
    this.addEventListener(closeButton, 'click', this.onCloseClick_);

    var cancelButton = this.container.querySelector('.cancel-button');
    this.addEventListener(cancelButton, 'click', this.onCloseClick_);

    // Event Delegation for dynamically created elements
    this.addEventListener(this.historyListEl, 'click', this.onHistoryItemClick_);
    this.addEventListener(this.resultsContentEl, 'click', this.onResultsContentClick_);

    // --- Initial State ---
    // if (this.model.sessions.length === 0) {
    //   this.createNewSession_('My First Session');
    // } else {
    //   this.updateView_();
    // }
  };

  // =================================================================
  //                             EVENT HANDLERS
  // =================================================================
  ns.PixelOnDetailController.prototype.onCreateSessionClick_ = function (evt) {

  };

  ns.PixelOnDetailController.prototype.onHistoryItemClick_ = function (evt) {
    const clickedItem = evt.target;
    if (clickedItem.tagName === 'LI') {
          const allItems = this.historyListEl.querySelectorAll('li');
          allItems.forEach(item => item.classList.remove('selected'));
          clickedItem.classList.add('selected');
      }
  };

  ns.PixelOnDetailController.prototype.onGenerateClick_ = function () {

  };

  ns.PixelOnDetailController.prototype.onResultsContentClick_ = function (evt) {

  };

  ns.PixelOnDetailController.prototype.onExportClick_ = function () {

  };

  ns.PixelOnDetailController.prototype.onCloseClick_ = function () {
    this.originalParent.insertBefore(this.paletteContainer, this.originalNextSibling)
    this.closeDialog()
  }

  ns.PixelOnDetailController.prototype.onCloseFuncs_ = function(evt) {
    if (evt.target === this.dialogWrapper) {
      this.originalParent.insertBefore(this.paletteContainer, this.originalNextSibling)
    }
  }

  // =================================================================
  //                         PRIVATE HELPER METHODS
  // =================================================================
  ns.PixelOnDetailController.prototype.createNewSession_ = function (name) {

  };

  ns.PixelOnDetailController.prototype.getActiveSession_ = function () {

  };

  ns.PixelOnDetailController.prototype.createPlaceholderImage_ = function(width, height) {

  };

  // =================================================================
  //                             VIEW RENDERING
  // =================================================================
  ns.PixelOnDetailController.prototype.updateView_ = function () {
    this.renderHistory_();
    this.renderSettings_();
    this.renderResults_();
  };

  ns.PixelOnDetailController.prototype.renderHistory_ = function () {

  };

  ns.PixelOnDetailController.prototype.renderSettings_ = function () {

  };

  ns.PixelOnDetailController.prototype.renderResults_ = function () {

  };

})();
