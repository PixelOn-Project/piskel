(function () {
    var ns = $.namespace('pskl.controller.dialogs');

    ns.PixelOnDetailController = function (piskelController, args) {
        this.piskelController = piskelController;
        this.pixelOnController = pskl.app.pixelOnController;
        this.args = args;
    };
    pskl.utils.inherit(ns.PixelOnDetailController, pskl.controller.dialogs.AbstractDialogController);


    ns.PixelOnDetailController.prototype.init = function () {
        this.container = document.querySelector('[data-dialog-id="pixel-on-detail"]');

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

        // Select Controls
        this.selectControlsEl = this.container.querySelector('.select-controls');
        this.selectedCountEl = this.container.querySelector('.selected-count');
        this.cancelSelectButton = this.container.querySelector('.cancel-select-button');

        // Template 추가
        this.historyBlockTemplate_ = pskl.utils.Template.get('history-block-template')
        this.imageFrameTemplate = pskl.utils.Template.get('image-frame-template')

        this.dialogWrapper = this.container.parentNode.parentNode;

        this.paletteArea = document.querySelector('.prompt-column .palette-area')
        this.paletteContainer = document.getElementById("palettes-list-container")
        this.originalParent = this.paletteContainer.parentNode;
        this.originalNextSibling = this.paletteContainer.nextSibling

        this.paletteArea.appendChild(this.paletteContainer)

        // addEventListener
        this.addEventListener(this.dialogWrapper, 'click', this.onCloseFuncs_, true)
        this.addEventListener(this.createSessionButton, 'click', this.onCreateSessionClick_);
        this.addEventListener(this.generateButton, 'click', this.onGenerateClick_);
        this.addEventListener(this.exportButton, 'click', this.onExportClick_);
        this.addEventListener(this.cancelSelectButton, 'click', this.onCancelSelectClick_.bind(this));

        var closeButton = this.container.querySelector('.dialog-close');
        this.addEventListener(closeButton, 'click', this.onCloseClick_);

        var cancelButton = this.container.querySelector('.cancel-button');
        this.addEventListener(cancelButton, 'click', this.onCloseClick_);

        this.addEventListener(this.historyListEl, 'click', this.onHistoryItemClick_.bind(this));
        this.addEventListener(this.resultsContentEl, 'click', this.onResultsContentClick_.bind(this));
        this.addEventListener(document, 'click', this.onDocumentClick_.bind(this));

        // 현재 조작중인 Session
        this.currentSession = this.pixelOnController.getSessions().length > 0? this.pixelOnController.getSessions() : null;

        // 초기화 진행
        this.initHistoryList_();

    };

    // =================================================================
    //                         HTML Controller
    // =================================================================
    ns.PixelOnDetailController.prototype.initHistoryList_ = function() {
        // PixelOn에 있는 모든 Session에 대한 History 초기화
        const sessions = this.pixelOnController.getSessions();
        if (sessions.length > 0) {
            sessions.forEach((session) => {
                const tmp = this.createHistoryBlock_(session);
                tmp.classList.remove('selected');
            })
        }

    };
    ns.PixelOnDetailController.prototype.initResult_ = function(imageList) {
        // 입력받은 imageList로 result를 초기화
        // result 모두 제거
        // 새로운 객체 생성
    };
    ns.PixelOnDetailController.prototype.createHistoryBlock_ = function(session) {
        // session을 입력 받으면, 가장 위에 HistoryBlock 하나 생성
        // historyListEl (history-list)에 history-block-template 생성해서 넣기
        var historyBlockItem = pskl.utils.Template.replace(this.historyBlockTemplate_, {
            'historyName': session.getName(),
            'uuid': session.getUuid()
        });
        var historyBlock = pskl.utils.Template.createFromHTML(historyBlockItem);
        this.historyListEl.insertBefore(historyBlock, this.historyListEl.firstChild.nextSibling);

        // selected 된거 표시
        var allItems = this.historyListEl.querySelectorAll('.history-block');
        allItems.forEach(function(item) {
            item.classList.remove('selected');
        });
        historyBlock.classList.add('selected');

        // 생성된 Block 돌려줌
        return historyBlock;
    }
    ns.PixelOnDetailController.prototype.updateResult_ = function(sessionUuid, image) {
        // 입력받은 image가 현재 session에 있으면 ImageFrame 하나 생성
        // 없으면 무시
        if (this.currentSession) {
            if (this.currentSession.getUuid() === sessionUuid) {
                // ImageFrame 하나 맨 뒤에 생성

            }
        }
    }

    

    // =================================================================
    //                          Event Handler
    // =================================================================
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
                // model 에서도 삭제 기능 추가
                this.pixelOnController.removeSessionByUuid(historyItem.getAttribute("uuid"));
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

        input.addEventListener('blur', () => {
            disableRename();
            
        });
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

            // model에서도 수정 진행
            const uuid = input.parentElement?.getAttribute("uuid");
            this.pixelOnController.renameSession(uuid, newName);
        }

        nameSpan.style.display = '';
        try {
            if (input.parentElement) {
                input.parentElement.removeChild(input);
            }
        }
        catch(e) {
            return;
        }
    };

    ns.PixelOnDetailController.prototype.onDocumentClick_ = function (evt) {
        // history-item-actions 영역 외부를 클릭하면 메뉴를 닫습니다.
        if (!evt.target.closest('.history-item-actions')) {
            this.closeAllHistoryItemMenus_();
        }
        // image-actions 영역 외부를 클릭하면 메뉴를 닫습니다.
        if (!evt.target.closest('.image-actions')) {
            this.closeAllImageMenus_();
        }
    };

    ns.PixelOnDetailController.prototype.onGenerateClick_ = function () {
        // Positive prompt 불러오기
        const p_prompt = this.positivePromptEl.value;
        const n_prompt = this.negativePromptEl.value;
        const width = this.widthInputEl.value;
        const height = this.heightInputEl.value;
        const generateCount = this.countInputEl.value;

        // TODO: 그 외 더 필요한 Detail 추가

        // Session 생성
        var session = new pskl.model.pixelOn.AiSession(p_prompt, {
            p_prompt: p_prompt,
            n_prompt: n_prompt,
            width: width,
            height: height,
            generateCount: generateCount
        });
        // 생성된 session 추가, (항상 맨 뒤에 추가됨)
        pskl.app.pixelOnController.addSession(session);

        // API 보내기
        
        // createHistoryBlock_ 생성해서 넣기
        this.createHistoryBlock_(session);

        // currentSession 수정
        this.currentSession = session;
    };

    ns.PixelOnDetailController.prototype.onResultsContentClick_ = function (evt) {
        var target = evt.target;
        var imageFrame = target.closest('.image-frame');

        if (target.classList.contains('image-menu-button')) {
            this.toggleImageMenu_(target);
            return;
        }

        if (target.classList.contains('image-action-delete')) {
            if (imageFrame) {
                imageFrame.remove();
                this.updateSelectControls_(); // 삭제 후 UI 업데이트
            }
            this.closeAllImageMenus_();
            return;
        }

        // 메뉴 버튼이나 그 안의 내용이 아닌, 이미지 프레임 자체를 클릭했을 때
        if (imageFrame && !target.closest('.image-actions')) {
            imageFrame.classList.toggle('selected');
            this.updateSelectControls_();
        }
    };

    ns.PixelOnDetailController.prototype.updateSelectControls_ = function () {
        var selectedFrames = this.resultsContentEl.querySelectorAll('.image-frame.selected');
        var count = selectedFrames.length;

        if (count > 0) {
            this.selectedCountEl.textContent = count + ' selected';
            this.selectControlsEl.style.display = 'flex';
        } else {
            this.selectControlsEl.style.display = 'none';
        }
    };

    ns.PixelOnDetailController.prototype.onCancelSelectClick_ = function () {
        var selectedFrames = this.resultsContentEl.querySelectorAll('.image-frame.selected');
        selectedFrames.forEach(function (frame) {
            frame.classList.remove('selected');
        });
        this.updateSelectControls_();
    };

    ns.PixelOnDetailController.prototype.toggleImageMenu_ = function (button) {
        var menu = button.nextElementSibling;
        var isVisible = menu.style.display === 'block';
        this.closeAllImageMenus_();

        if (!isVisible) {
            menu.style.display = 'block';
        }
    };

    ns.PixelOnDetailController.prototype.closeAllImageMenus_ = function () {
        var allMenus = this.resultsContentEl.querySelectorAll('.image-menu');
        allMenus.forEach(function(menu) {
            menu.style.display = 'none';
        });
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