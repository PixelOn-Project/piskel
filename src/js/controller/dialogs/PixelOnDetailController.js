(function () {
    var ns = $.namespace('pskl.controller.dialogs');

    ns.PixelOnDetailController = function (piskelController, args) {
        this.piskelController = piskelController;
        this.pixelOnController = pskl.app.pixelOnController;
        this.args = args;

        this.sample_data = [
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAABoElEQVR4AeyV4XIDIQiE2T55++TXXaKJXkG8dm76J46oKCyfJpN82D+3N0D2Agc/GRmne3sGYMfh9TXIbqNIAVSxQfhSwx22BFDBAULuXyx8yRJAFRtEKKDzDUtzUwAAZl9p3kbNZwj5c50MgNWbQIOgijZyJZ3+NKYdBrzkziEZgOKAz9WxVc2LD68YUuxVaK9QVRzOn8XxuERY3NgqgNcrEIKqTLGDQ2UMMcOjuK1aBaDcF4Q8mkAi45F3nQF+aQ0y34+GHQDPQ7uNxC1p/QxY1pyytwG6+JQdOIqTBUfh1jZAmL3YbBD9u5JG7gBQSzqpRnrAxPFPLYzbAZgSAYQ/LEC8PyUHTgXAS/zu9mMtisgNhSoAJU4mMdm0SUd7Mi4v9csAl9Q3gt8AqxfgRzp/bwBMjwqs/R4MeJwPfa/PK4AeszUDoX6ZexkAgP8OAHBxAO7L4ZNpmgzA5J+dFQDYpngVWNkUTGfITylWAJSw5+2saCp2NqaosIzLuFcASqYuHISLdKY8AuPWulcAPTsSP+/12EvzLsAl0TG4Wn8DAAD//1SS+kMAAAAGSURBVAMAarinQckpiIkAAAAASUVORK5CYII=",
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAABr0lEQVR4AeyUwU0DMRBFHTqgBY40gEQDHKiAGxfuXDhx5kJogFKQaIBqEhpg8RuNN8Os7bW1K4FQov3rmdk/f76dTU7CL3+OBv70CQzx9bCI6fpX6QQYHLZXpwIdKzWNV1tKBuzgH/Fqk1WoaECf+6XnFOB6eL1QNXB9czc28HVo4kVtrpRATU6OPqAPpK6xLFUDMKwJcoCgB/UIBgAZHvPxgj8mJigZ2Dy87YR2ef8qKzdEALEHdUA9rcRsABDnUDIg3PPb5/B4UaUIz97s8KePr5A2kDZkucQ19Q2EJcD8fv8Z2EjUQQ/E8HDVDBxYCyJ7IjmZmoHBNnOEwItQA77empcMyJvcKrKElzMgw+3uGUAOiC2oAVvrib2B7PAewV6uNzD5A+kV9Py592NiwAuslE9+fkm3y8DcbpJoWpVfHA6vakAF4AUbS2Hm1sqfGPCN5GDY7gIgtsj54Hmss3MQw/LlDUiDCsgLyU8MvLyfBUBsYaXpA7Y2F3sD8EcTiAGKnRCNlp6cAfoQGIGJFtAYQV9c2q6SAd+NaCt8bzVvNVAVWfLwaOD/n8Dc+/ENAAD//zmWiXwAAAAGSURBVAMAUL+fQURvOjIAAAAASUVORK5CYII=",
        ]
        this.sample_count = 0;
    };
    pskl.utils.inherit(ns.PixelOnDetailController, pskl.controller.dialogs.AbstractDialogController);


    ns.PixelOnDetailController.prototype.init = function () {
        this.container = document.querySelector('[data-dialog-id="pixel-on-detail"]');

        this.historyListEl = this.container.querySelector('.history-list');
        this.createSessionButton = this.container.querySelector('#new-session');
        this.positivePromptEl = this.container.querySelector('.positive-prompt');
        this.negativePromptEl = this.container.querySelector('.negative-prompt');
        this.widthInputEl = this.container.querySelector('.resolution-input[data-param="width"]');
        this.heightInputEl = this.container.querySelector('.resolution-input[data-param="height"]');
        this.countInputEl = this.container.querySelector('.count-input');
        this.generateButton = this.container.querySelector('.generate-button');
        this.resultsTitleEl = this.container.querySelector('.results-title');
        this.resultsContainerEl = this.container.querySelector('.result-container');

        this.statusTextEl = this.container.querySelector('.status-text');

        // Select Controls
        this.selectControlsEl = this.container.querySelector('.select-controls');
        this.selectedCountEl = this.container.querySelector('.selected-count');
        this.cancelSelectButton = this.container.querySelector('.cancel-select-button');

        // Template 추가
        this.historyBlockTemplate_ = pskl.utils.Template.get('history-block-template')
        this.imageFrameTemplate_ = pskl.utils.Template.get('image-frame-template')

        this.dialogWrapper = this.container.parentNode.parentNode;

        this.paletteArea = document.querySelector('.prompt-column .palette-area')
        this.paletteContainer = document.getElementById("palettes-list-container")
        this.originalParent = this.paletteContainer.parentNode;
        this.originalNextSibling = this.paletteContainer.nextSibling

        this.paletteArea.appendChild(this.paletteContainer)

        // addEventListener
        this.addEventListener(this.dialogWrapper, 'click', this.onCloseFuncs_, true)
        this.addEventListener(this.createSessionButton, 'click', this.onNewSessionClick_);
        this.addEventListener(this.generateButton, 'click', this.onGenerateClick_);

        this.addEventListener(this.cancelSelectButton, 'click', this.onCancelSelectClick_.bind(this));

        var closeButton = this.container.querySelector('.dialog-close');
        this.addEventListener(closeButton, 'click', this.onCloseClick_);

        var cancelButton = this.container.querySelector('.cancel-button');
        this.addEventListener(cancelButton, 'click', this.onCloseClick_);

        this.addEventListener(this.historyListEl, 'click', this.onHistoryItemClick_.bind(this));
        this.addEventListener(this.resultsContainerEl, 'click', this.onResultsContentClick_.bind(this));
        this.addEventListener(document, 'click', this.onDocumentClick_.bind(this));

        // 현재 조작중인 Session
        this.currentSession = null;

        // 새로운 세션 하나 만들어서 뿌림
        this.onNewSessionClick_();
    };

    // =================================================================
    //                         HTML Controller
    // =================================================================
    ns.PixelOnDetailController.prototype.initHistoryList_ = function() {
        const new_session = this.historyListEl.firstElementChild; 
        this.historyListEl.innerHTML = '';
        this.historyListEl.appendChild(new_session);

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
        this.resultsContainerEl.innerHTML = '';

        // imageList가 주어지면 UUID로 값 가지고 와서 새로운 객체 생성
        imageList.forEach((uuid) => {
            this.createImageFrame_(this.pixelOnController.getImage(uuid));
        });
    };
    ns.PixelOnDetailController.prototype.initDefault_ = function(spec) {
        // pxielon에 초기 Default 값으로 value 초기화
        const pixelOn = this.pixelOnController;

        if (!spec) {
            spec = {
                p_prompt: "",
                n_prompt: "",
                width: pixelOn.getWidth(),
                height: pixelOn.getWidth(),
                generateCount: pixelOn.getGenerateCount(),
            }
        }
        

        this.positivePromptEl.value = spec.p_prompt;
        this.negativePromptEl.value = spec.n_prompt;
        this.widthInputEl.value = spec.width;
        this.heightInputEl.value = spec.height;
        this.countInputEl.value = spec.generateCount;
    };
    ns.PixelOnDetailController.prototype.getSpec_ = function() {
        // spec 불러오기
        const p_prompt = this.positivePromptEl.value;
        const n_prompt = this.negativePromptEl.value;
        const width = this.widthInputEl.value;
        const height = this.heightInputEl.value;
        const generateCount = this.countInputEl.value;
        // TODO: 그 외 더 필요한 Detail 추가

        spec = {
            p_prompt: p_prompt,
            n_prompt: n_prompt,
            width: width,
            height: height,
            generateCount: generateCount
        };
        return spec;
    }
    ns.PixelOnDetailController.prototype.createHistoryBlock_ = function(session) {
        // session을 입력 받으면, 가장 위에 HistoryBlock 하나 생성
        // historyListEl (history-list)에 history-block-template 생성해서 넣기
        var historyBlockItem = pskl.utils.Template.replace(this.historyBlockTemplate_, {
            'historyName': session.getName(),
            'uuid': session.getUuid()
        });
        var historyBlock = pskl.utils.Template.createFromHTML(historyBlockItem);
        const next = this.historyListEl.firstElementChild.nextElementSibling
        this.historyListEl.insertBefore(historyBlock, next);

        // selected 된거 표시
        var allItems = this.historyListEl.querySelectorAll('.history-block');
        allItems.forEach(function(item) {
            item.classList.remove('selected');
        });
        historyBlock.classList.add('selected');

        // 생성된 Block 돌려줌
        return historyBlock;
    }
    ns.PixelOnDetailController.prototype.createImageFrame_ = function(image) {
        // ImageFrame 하나 맨 뒤에 생성
        const imageFrameItme = pskl.utils.Template.replace(this.imageFrameTemplate_, {
            "img": image
        })
        const imageFrame = pskl.utils.Template.createFromHTML(imageFrameItme);
        this.resultsContainerEl.appendChild(imageFrame);
    }

    // =================================================================
    //                          Event Handler
    // =================================================================
    ns.PixelOnDetailController.prototype.onNewSessionClick_ = function (evt) {
        // 현재 작업중인 Session = null로
        this.currentSession = null;
        
        this.initHistoryList_();
        this.initDefault_(null);
        this.initResult_([]);
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

            // historyItem의 uuid를 통해 currentSession 업데이트
            const targetUuid = historyItem.getAttribute("uuid");
            if (this.currentSession?.getUuid() !== targetUuid) {
                // uuid 다르면 Prompts, Result 다시 초기화
                const currentSession = this.pixelOnController.getSessionByUuid(targetUuid);
                this.initDefault_(currentSession.getSpec());
                this.initResult_(currentSession.getImageUuidsList());

                // 초기화 이후 변경
                this.currentSession = currentSession
            } 
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
        const spec = this.getSpec_();

        // Session 있으면, 기존 session에 데이터 저장, 없으면 생성
        currentSession = this.currentSession;

        if (currentSession) {
            currentSession.setSpec(spec)
        }
        else {
            currentSession =  new pskl.model.pixelOn.AiSession(spec.p_prompt, spec);
            pskl.app.pixelOnController.addSession(currentSession);
            // createHistoryBlock_ 생성해서 넣기
            this.createHistoryBlock_(currentSession);
        }
        

        // API 보내기
        // 받았다 치고, Image 하나 추가해보기
        setTimeout(this.onResultRecive.bind(this, currentSession.getUuid(), this.sample_data[Math.floor(Math.random() * this.sample_data.length)]), 1000)

        // 현재 작업중인 Session 업데이트
        this.currentSession = currentSession;
    };
    ns.PixelOnDetailController.prototype.onResultRecive = function(uuid, img) {
        // uuid: session의 uuid, img: 이미지 (base64png)로 인코딩 되었다고 가정.
        // 원래 service가 데이터까지 처리하지만, 임시로 controller에서 진행
        // 1. Image 등록
        const session = this.pixelOnController.getSessionByUuid(uuid);
        const imgUuid = this.pixelOnController.addImage(img);
        
        // 2. Image UUID Session에 등록
        if (session) {
            session.addImageUuid(imgUuid);
        }
        // ------------------------ 임시 코드 ------------------------ 
        // 현재 세션이랑 동일하다면, img 생성
        if (session === this.currentSession) {
            this.createImageFrame_(img);
        }
    }

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
        var selectedFrames = this.resultsContainerEl.querySelectorAll('.image-frame.selected');
        var count = selectedFrames.length;

        if (count > 0) {
            this.selectedCountEl.textContent = count + ' selected';
            this.selectControlsEl.style.display = 'flex';
        } else {
            this.selectControlsEl.style.display = 'none';
        }
    };

    ns.PixelOnDetailController.prototype.onCancelSelectClick_ = function () {
        var selectedFrames = this.resultsContainerEl.querySelectorAll('.image-frame.selected');
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
        var allMenus = this.resultsContainerEl.querySelectorAll('.image-menu');
        allMenus.forEach(function(menu) {
            menu.style.display = 'none';
        });
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