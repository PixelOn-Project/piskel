(function () {
    var ns = $.namespace('pskl.controller.dialogs');

    var instance = null;

    ns.PixelOnDetailController = function (piskelController, args) {
        this.piskelController = piskelController;
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
        this.container = document.querySelector('[data-dialog-id="pixel-on-detail"]');
        this.isShow_ = true

        this.historyListEl = this.container.querySelector('.history-list');
        this.historyContentsEl = this.container.querySelector('.history-contents');
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

        // Template 추가
        this.historyBlockTemplate_ = pskl.utils.Template.get('history-block-template')
        this.imageFrameTemplate = pskl.utils.Template.get('image-frame-template')

        this.dialogWrapper = this.container.parentNode.parentNode;

        this.paletteArea = document.querySelector('.prompt-column .palette-area')
        this.paletteContainer = document.getElementById("palettes-list-container")
        this.originalParent = this.paletteContainer.parentNode;
        this.originalNextSibling = this.paletteContainer.nextSibling

        this.paletteArea.appendChild(this.paletteContainer)

        this.addEventListener(this.dialogWrapper, 'click', this.onCloseFuncs_, true)
        this.addEventListener(this.createSessionButton, 'click', this.onCreateSessionClick_);
        this.addEventListener(this.generateButton, 'click', this.onGenerateClick_);
        this.addEventListener(this.exportButton, 'click', this.onExportClick_);

        var closeButton = this.container.querySelector('.dialog-close');
        this.addEventListener(closeButton, 'click', this.onCloseClick_);

        var cancelButton = this.container.querySelector('.cancel-button');
        this.addEventListener(cancelButton, 'click', this.onCloseClick_);

        this.addEventListener(this.historyListEl, 'click', this.onHistoryItemClick_.bind(this));
        this.addEventListener(this.resultsContentEl, 'click', this.onResultsContentClick_);
        this.addEventListener(document, 'click', this.onDocumentClick_.bind(this));
    };

    ns.PixelOnDetailController.prototype.onCreateSessionClick_ = function (evt) {

    };

    ns.PixelOnDetailController.prototype.onHistoryItemClick_ = function (evt) {
        var target = evt.target;

        if (target.classList.contains('history-item-menu-button')) {
            this.toggleHistoryItemMenu_(target);
            return;
        }

        if (target.classList.contains('history-item-action-rename')) {
            var historyItem = target.closest('.history-block');
            this.enableRenameMode_(historyItem);
            this.closeAllHistoryItemMenus_();
            return;
        }

        if (target.classList.contains('history-item-action-delete')) {
            var historyItem = target.closest('.history-block');
            if (historyItem) {
                historyItem.remove();
            }
            this.closeAllHistoryItemMenus_();
            return;
        }

        var historyItem = target.closest('.history-block');
        if (historyItem && !historyItem.querySelector('input')) {
            var allItems = this.historyListEl.querySelectorAll('.history-block');
            allItems.forEach(function(item) {
                item.classList.remove('selected');
            });
            historyItem.classList.add('selected');
        }
    };

    ns.PixelOnDetailController.prototype.toggleHistoryItemMenu_ = function (button) {
        // 메뉴를 토글하고 다른 메뉴를 닫습니다.
        var menu = button.nextElementSibling;
        var isVisible = menu.style.display === 'block';
        this.closeAllHistoryItemMenus_();

        if (!isVisible) {
            // 메뉴를 표시합니다. 위치는 CSS (position: absolute; top: 100%; right: 0;)가 담당합니다.
            menu.style.display = 'block';
        }
    };

    ns.PixelOnDetailController.prototype.closeAllHistoryItemMenus_ = function () {
        // 열려 있는 모든 이력 항목 메뉴를 닫습니다.
        var allMenus = this.historyListEl.querySelectorAll('.history-item-menu');
        allMenus.forEach(function(menu) {
            menu.style.display = 'none';
        });
    };

    ns.PixelOnDetailController.prototype.enableRenameMode_ = function (historyItem) {
        var nameSpan = historyItem.querySelector('.history-item-name');
        var currentName = nameSpan.textContent;

        var input = document.createElement('input');
        input.type = 'text';
        input.className = 'history-item-name-input';
        input.value = currentName;

        nameSpan.style.display = 'none';
        nameSpan.parentNode.insertBefore(input, nameSpan.nextSibling);
        input.focus();
        input.select();

        var disableRename = this.disableRenameMode_.bind(this, input, nameSpan);

        input.addEventListener('blur', disableRename);
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                disableRename();
            } else if (e.key === 'Escape') {
                input.value = currentName;
                disableRename();
            }
        });
    };

    ns.PixelOnDetailController.prototype.disableRenameMode_ = function (input, nameSpan) {
        var newName = input.value.trim();
        if (newName) {
            nameSpan.textContent = newName;
        }
        nameSpan.style.display = '';
        if (input.parentNode) {
            input.parentNode.removeChild(input);
        }
    };

    ns.PixelOnDetailController.prototype.onDocumentClick_ = function (evt) {
        // history-item-actions 영역 외부를 클릭하면 메뉴를 닫습니다.
        if (!evt.target.closest('.history-item-actions')) {
            this.closeAllHistoryItemMenus_();
        }
    };

    ns.PixelOnDetailController.prototype.onGenerateClick_ = function () {
        // Positive prompt 불러오기
        // Negative Prompt 불러오기
        // Resolution 불러오기
        // Count 불러오기
        // API 보내기
        
        // historyListEl (history-list)에 history-block-template 생성해서 넣기
        var historyBlockItem = pskl.utils.Template.replace(this.historyBlockTemplate_, {
            'historyName': 'prompt_name_here...',
            'uuid': 'session_uuid_here...'
        });
        var historyBlock = pskl.utils.Template.createFromHTML(historyBlockItem);
        this.historyListEl.insertBefore(historyBlock, this.historyListEl.firstChild);

        // PixelOn Model에 새로운 AISession 추가하기
        

        // selected 된거 표시
        var allItems = this.historyListEl.querySelectorAll('.history-block');
        allItems.forEach(function(item) {
            item.classList.remove('selected');
        });
        historyBlock.classList.add('selected');

        // API 불러오기
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
})();