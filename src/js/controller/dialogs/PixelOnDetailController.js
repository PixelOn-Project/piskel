(function () {
    var ns = $.namespace('pskl.controller.dialogs');

    ns.PixelOnDetailController = function (piskelController, args) {
        this.piskelController = piskelController;
        this.pixelOnController = pskl.app.pixelOnController;
        this.sdController = pskl.app.sdController; // Get SDController instance
        this.args = args;
        this.callbackId = 'pixel-on-detail'; // Unique ID for callbacks
    };
    pskl.utils.inherit(ns.PixelOnDetailController, pskl.controller.dialogs.AbstractDialogController);


    ns.PixelOnDetailController.prototype.init = function () {
        this.container = document.querySelector('[data-dialog-id="pixel-on-detail"]');

        this.isGenerating = false; // This will be managed by SDController's state

        this.historyListEl = this.container.querySelector('.history-list');
        this.createSessionButton = this.container.querySelector('#new-session');

        // Tag Inputs
        this.positivePromptContainer = this.container.querySelector('.positive-prompt-container');
        this.positivePromptInput = this.positivePromptContainer.querySelector('.tag-input');
        this.negativePromptContainer = this.container.querySelector('.negative-prompt-container');
        this.negativePromptInput = this.negativePromptContainer.querySelector('.tag-input');

        this.widthInputEl = this.container.querySelector('.resolution-input[data-param="width"]');
        this.heightInputEl = this.container.querySelector('.resolution-input[data-param="height"]');
        this.countInputEl = this.container.querySelector('.count-input');
        this.generateButton = this.container.querySelector('.generate-button');
        this.testImageButton = this.container.querySelector('.test-image-button');
        this.resultsContainerEl = this.container.querySelector('.result-container');
        this.statusTextEl = this.container.querySelector('.status-text');
        this.btnMoveToFrame = this.container.querySelector('.move-to-frame-button');
        this.btnMoveToLayer = this.container.querySelector('.move-to-layer-button');

        // Preset Controls
        this.presetStatusEl = this.container.querySelector('.preset-status');
        this.presetButtonsContainer = this.container.querySelector('.preset-buttons');
        this.presetButtons = this.container.querySelectorAll('.preset-button');

        // Select Controls
        this.selectControlsEl = this.container.querySelector('.select-controls');
        this.selectedCountEl = this.container.querySelector('.selected-count');
        this.cancelSelectButton = this.container.querySelector('.cancel-select-button');
        this.deleteSelectButton = this.container.querySelector('.delete-select-button');

        // Size Warning
        this.sizeWarningEl = this.createSizeWarningElement_();

        // Template 추가
        this.historyBlockTemplate_ = pskl.utils.Template.get('history-block-template')
        this.imageFrameTemplate_ = pskl.utils.Template.get('image-frame-template')

        this.dialogWrapper = this.container.parentNode.parentNode;

        // Register callbacks with SDController
        this.sdController.registerCallbacks(this.callbackId, {
            onProgress: this.updateUiForGenerationState_.bind(this),
            onImage: this.onImageReceive_.bind(this),
            onDone: this.onGenerationDone_.bind(this),
            onError: this.onGenerationError_.bind(this)
        });

        // addEventListener
        this.addEventListener(this.dialogWrapper, 'click', this.onCloseFuncs_, true)
        this.addEventListener(this.createSessionButton, 'click', this.onNewSessionClick_);
        this.addEventListener(this.generateButton, 'click', this.onGenerateClick_);
        this.addEventListener(this.testImageButton, 'click', this.onTestImageClick_.bind(this));
        this.addEventListener(this.presetButtonsContainer, 'click', this.onPresetButtonClick_.bind(this));

        this.addEventListener(this.cancelSelectButton, 'click', this.onCancelSelectClick_.bind(this));
        this.addEventListener(this.deleteSelectButton, 'click', this.onDeleteSelectClick_.bind(this));

        var closeButton = this.container.querySelector('.dialog-close');
        this.addEventListener(closeButton, 'click', this.onCloseClick_);

        var cancelButton = this.container.querySelector('.cancel-button');
        this.addEventListener(cancelButton, 'click', this.onCloseClick_);

        this.addEventListener(this.historyListEl, 'click', this.onHistoryItemClick_.bind(this));
        this.addEventListener(this.resultsContainerEl, 'click', this.onResultsContentClick_.bind(this));
        this.addEventListener(document, 'click', this.onDocumentClick_.bind(this));

        this.addEventListener(this.btnMoveToFrame, 'click', this.onMoveToFrame_.bind(this));
        this.addEventListener(this.btnMoveToLayer, 'click', this.onMoveToLayer_.bind(this));

        // Tag Event Listeners
        this.addEventListener(this.positivePromptInput, 'keydown', this.onTagInputKeyDown_.bind(this, this.positivePromptContainer));
        this.addEventListener(this.negativePromptInput, 'keydown', this.onTagInputKeyDown_.bind(this, this.negativePromptContainer));
        this.addEventListener(this.positivePromptContainer, 'click', this.onTagContainerClick_.bind(this));
        this.addEventListener(this.negativePromptContainer, 'click', this.onTagContainerClick_.bind(this));

        // 현재 조작중인 Session
        this.currentSession = null;

        // 새로운 세션 하나 만들어서 뿌림
        this.onNewSessionClick_();

        this.btnMoveToFrame.disabled = true;
        this.btnMoveToLayer.disabled = true;
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
            this.createImageFrame_(uuid, this.pixelOnController.getImage(uuid));
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
                count: pixelOn.getGenerateCount(),
                presset: "normal" // Default preset
            }
        }

        this.clearTags_(this.positivePromptContainer);
        spec.p_prompt.split(',').forEach(tag => {
            if (tag.trim()) this.addTag_(this.positivePromptContainer, tag.trim());
        });

        this.clearTags_(this.negativePromptContainer);
        spec.n_prompt.split(',').forEach(tag => {
            if (tag.trim()) this.addTag_(this.negativePromptContainer, tag.trim());
        });

        this.widthInputEl.value = spec.width;
        this.heightInputEl.value = spec.height;
        this.countInputEl.value = spec.count;
        this.updateSelectControls_();
        
        // Update preset buttons
        this.presetButtons.forEach(function(button) {
            button.classList.remove('active');
            if (button.dataset.preset === (spec.presset || "normal")) {
                button.classList.add('active');
            }
        });
        this.updatePresetStatus_();
    };
    ns.PixelOnDetailController.prototype.getSpec_ = function() {
        // spec 불러오기
        const p_prompt = this.getTagsAsString_(this.positivePromptContainer);
        const n_prompt = this.getTagsAsString_(this.negativePromptContainer);
        const width = parseInt(this.widthInputEl.value, 10);
        const height = parseInt(this.heightInputEl.value, 10);
        const count = parseInt(this.countInputEl.value, 10);
        
        const activeButton = this.presetButtonsContainer.querySelector('.preset-button.active');
        const presset = activeButton ? activeButton.dataset.preset : 'normal';

        return {
            p_prompt: p_prompt,
            n_prompt: n_prompt,
            width: width,
            height: height,
            count: count,
            presset: presset
        };
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
    ns.PixelOnDetailController.prototype.createImageFrame_ = function(uuid, data) {
        // ImageFrame 하나 맨 뒤에 생성
        const imageFrameItme = pskl.utils.Template.replace(this.imageFrameTemplate_, {
            "uuid": uuid,
            "img": data.image,
        })
        const imageFrame = pskl.utils.Template.createFromHTML(imageFrameItme);
        this.resultsContainerEl.appendChild(imageFrame);
    }

    ns.PixelOnDetailController.prototype.updateUiForGenerationState_ = function(isGenerating, statusMessage) {
        this.isGenerating = isGenerating;
        if (isGenerating) {
            this.generateButton.textContent = 'Stop';
            this.generateButton.classList.add('stop-button');
            this.statusTextEl.textContent = statusMessage || 'Generating...';
        } else {
            this.generateButton.textContent = 'Generate';
            this.generateButton.classList.remove('stop-button');
            this.statusTextEl.textContent = statusMessage || 'Ready';
        }
    };


    // =================================================================
    //                          Event Handler
    // =================================================================
    ns.PixelOnDetailController.prototype.onTestImageClick_ = function () {
        const spec = this.getSpec_();
        let currentSession = this.currentSession;

        if (!currentSession) {
            currentSession = new pskl.model.pixelOn.AiSession("Test Image", spec);
            this.pixelOnController.addSession(currentSession);
            this.createHistoryBlock_(currentSession);
            this.currentSession = currentSession;
        }
        
        const sampleImage = this.pixelOnController.sample_data[Math.floor(Math.random() * this.pixelOnController.sample_data.length)];
        const imgUuid = this.pixelOnController.addImage(sampleImage, spec);
        currentSession.addImageUuid(imgUuid);
        this.createImageFrame_(imgUuid, this.pixelOnController.getImage(imgUuid));
    };

    ns.PixelOnDetailController.prototype.onPresetButtonClick_ = function (evt) {
        var clickedButton = evt.target.closest('.preset-button');
        if (!clickedButton) return;

        // Turn off all buttons
        this.presetButtons.forEach(function (button) {
            button.classList.remove('active');
        });

        // Activate the clicked one
        clickedButton.classList.add('active');
        this.updatePresetStatus_();
    };

    ns.PixelOnDetailController.prototype.updatePresetStatus_ = function() {
        var activeButton = this.presetButtonsContainer.querySelector('.preset-button.active');
        if (activeButton) {
            this.presetStatusEl.textContent = activeButton.textContent;
        } else {
            this.presetStatusEl.textContent = 'None';
        }
    };

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
        var menu = button.nextElementSibling;
        var isVisible = menu.style.display === 'block';
        this.closeAllHistoryItemMenus_();

        if (!isVisible) {
            menu.style.display = 'block';
        }
    };

    ns.PixelOnDetailController.prototype.closeAllHistoryItemMenus_ = function () {
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
        if (!evt.target.closest('.history-item-actions')) {
            this.closeAllHistoryItemMenus_();
        }
        // Close image overlay if click is outside the image frame
        if (!evt.target.closest('.image-frame')) {
            this.closeAllImageActions_();
        }
    };

    ns.PixelOnDetailController.prototype.onGenerateClick_ = function () {
        if (this.isGenerating) {
            this.stopGeneration_();
        } else {
            this.startGeneration_();
        }
    };

    ns.PixelOnDetailController.prototype.startGeneration_ = function () {
        const spec = this.getSpec_();

        let currentSession = this.currentSession;
        if (!currentSession) {
            currentSession = new pskl.model.pixelOn.AiSession(spec.p_prompt, spec);
            this.pixelOnController.addSession(currentSession);
            this.createHistoryBlock_(currentSession);
            this.currentSession = currentSession;
        } else {
            currentSession.setSpec(spec);
        }

        this.sdController.generate(spec, currentSession.getUuid());
    };

    ns.PixelOnDetailController.prototype.stopGeneration_ = function () {
        if (this.currentSession) {
            this.sdController.stop(this.currentSession.getUuid());
        }
    };

    // =================================================================
    //                         SDController Callbacks
    // =================================================================

    ns.PixelOnDetailController.prototype.onImageReceive_ = function(data) {
        // Check if the image belongs to any session this controller knows about.
        const session = this.pixelOnController.getSessionByUuid(data.session_id);
        if (!session) return;

        const fullBase64 = `data:image/png;base64,${data.image_base64}`;
        const imgUuid = this.pixelOnController.addImage(fullBase64, data.spec);
        session.addImageUuid(imgUuid);

        // Only update the UI if the received image belongs to the currently active session.
        if (this.currentSession && session.getUuid() === this.currentSession.getUuid()) {
            this.createImageFrame_(imgUuid, this.pixelOnController.getImage(imgUuid));
        }
    };

    ns.PixelOnDetailController.prototype.onGenerationDone_ = function(data) {
        // Optional: Handle anything when the entire generation process is complete.
        console.log('Generation finished:', data.status);
    };

    ns.PixelOnDetailController.prototype.onGenerationError_ = function(errorMessage) {
        // The onProgress callback already updates the UI, but you can add more specific error handling here.
        console.error("Generation Error reported to Dialog:", errorMessage);
    };


    ns.PixelOnDetailController.prototype.onResultsContentClick_ = function (evt) {
        var target = evt.target;
        var imageFrame = target.closest('.image-frame');

        if (target.classList.contains('image-menu-button')) {
            this.toggleImageActions_(imageFrame);
            return;
        }

        if (target.classList.contains('image-action-delete')) {
            if (imageFrame) {
                imageFrame.remove();
                // 모델에서도 해당 이미지 session에서 제거
                this.currentSession.removeImageUuid(imageFrame.getAttribute("uuid"));
                this.updateSelectControls_(); // 삭제 후 UI 업데이트
            }
            this.closeAllImageActions_();
            return;
        }

        if (target.classList.contains('image-action-transfer-prompt')) {
            if (imageFrame) {
                // 내용 변경
                this.initDefault_(this.pixelOnController.getImage(imageFrame.getAttribute("uuid")).spec);
            }
            this.closeAllImageActions_();
            return;
        }

        // 메뉴 버튼이나 그 안의 내용이 아닌, 이미지 프레임 자체를 클릭했을 때
        if (imageFrame && !target.closest('.image-overlay-actions')) {
            imageFrame.classList.toggle('selected');
            this.updateSelectControls_();
        }
    };

    ns.PixelOnDetailController.prototype.updateSelectControls_ = function () {
        var selectedFrames = this.resultsContainerEl.querySelectorAll('.image-frame.selected');
        var count = selectedFrames.length;
        var buttons = [this.btnMoveToFrame, this.btnMoveToLayer];

        if (count > 0) {
            this.selectedCountEl.textContent = count + ' selected';
            this.selectControlsEl.style.display = 'flex';
            this.btnMoveToFrame.disabled = false;
            this.btnMoveToLayer.disabled = false;

            // Check for oversized images
            var isOversizedSelected = false;
            var targetWidth = this.piskelController.getWidth();
            var targetHeight = this.piskelController.getHeight();

            for (var i = 0; i < selectedFrames.length; i++) {
                var frame = selectedFrames[i];
                var imgElement = frame.querySelector('.image-dimensions-source');

                if (imgElement) {
                    var sourceWidth = imgElement.naturalWidth;
                    var sourceHeight = imgElement.naturalHeight;
                    console.log("Comparing: Image " + sourceWidth + "x" + sourceHeight + " with Palette " + targetWidth + "x" + targetHeight);
                    if (sourceWidth > targetWidth || sourceHeight > targetHeight) {
                        isOversizedSelected = true;
                        console.log("Oversized image detected.");
                        break;
                    }
                }
            }

            var warningMessage = this.sizeWarningEl.textContent;
            buttons.forEach(function(button) {
                if (isOversizedSelected) {
                    button.setAttribute('rel', 'tooltip');
                    button.setAttribute('data-placement', 'top');
                    button.setAttribute('title', warningMessage);
                    $(button).tooltip('fixTitle');
                } else {
                    // Ensure tooltip is removed and hidden if it was previously visible
                    if (button.hasAttribute('rel')) {
                        $(button).tooltip('hide');
                        button.removeAttribute('rel');
                        button.removeAttribute('title');
                        button.removeAttribute('data-placement');
                    }
                }
            });

        } else {
            this.selectControlsEl.style.display = 'none';
            this.btnMoveToFrame.disabled = true;
            this.btnMoveToLayer.disabled = true;

            // Ensure tooltips are removed when no items are selected
            buttons.forEach(function(button) {
                if (button.hasAttribute('rel')) {
                    $(button).tooltip('hide');
                    button.removeAttribute('rel');
                    button.removeAttribute('title');
                    button.removeAttribute('data-placement');
                }
            });
        }
    };

    ns.PixelOnDetailController.prototype.onCancelSelectClick_ = function () {
        var selectedFrames = this.resultsContainerEl.querySelectorAll('.image-frame.selected');
        selectedFrames.forEach(function (frame) {
            frame.classList.remove('selected');
        });
        this.updateSelectControls_();
    };

    ns.PixelOnDetailController.prototype.onDeleteSelectClick_ = function () {
        var selectedFrames = this.resultsContainerEl.querySelectorAll('.image-frame.selected');
        selectedFrames.forEach(function (frame) {
            // model 에서도 해당 이미지 session에서 제거
            this.currentSession.removeImageUuid(frame.getAttribute("uuid"));
            frame.remove();
        }.bind(this));
        this.updateSelectControls_(); // 삭제 후 UI 업데이트
    };

    ns.PixelOnDetailController.prototype.toggleImageActions_ = function (imageFrame) {
        var isOpen = imageFrame.classList.contains('actions-open');
        this.closeAllImageActions_();
        if (!isOpen) {
            imageFrame.classList.add('actions-open');
        }
    };

    ns.PixelOnDetailController.prototype.closeAllImageActions_ = function () {
        var allFrames = this.resultsContainerEl.querySelectorAll('.image-frame');
        allFrames.forEach(function(frame) {
            frame.classList.remove('actions-open');
        });
    };

    ns.PixelOnDetailController.prototype.onCloseClick_ = function () {
        if (this.isGenerating) {
            this.stopGeneration_();
        }
        this.sdController.unregisterCallbacks(this.callbackId); // Unregister callbacks
        this.closeDialog();
    }

    ns.PixelOnDetailController.prototype.onCloseFuncs_ = function(evt) {
        if (evt.target === this.dialogWrapper) {
            if (this.isGenerating) {
                this.stopGeneration_();
            }
        }
    }

    ns.PixelOnDetailController.prototype.onMoveToFrame_ = function(evt) {
        const selectedFrames = this.resultsContainerEl.querySelectorAll('.image-frame.selected');
        if (selectedFrames.length > 0) {
            const promises = [];
            selectedFrames.forEach((element) => {
                const promise = new Promise(function(resolve) {
                    const uuid = element.getAttribute("uuid");
                    const img = this.pixelOnController.getImage(uuid).image;
                    const callback = function (frame) {
                        this.createImageCallback_(frame);
                        resolve();
                    }.bind(this);
                    pskl.utils.FrameUtils.createFromImageSrc(img, false, callback);
                }.bind(this));
                promises.push(promise);
            }, this);

            Promise.all(promises).then(function () {
                // 프레임 추가 작업 전체를 하나의 스냅샷으로 기록
                $.publish(Events.PISKEL_SAVE_STATE, {
                    type: pskl.service.HistoryService.SNAPSHOT
                });
            }.bind(this));
        }
    }

    ns.PixelOnDetailController.prototype.onMoveToLayer_ = function(evt) {
        const selectedFrames = this.resultsContainerEl.querySelectorAll('.image-frame.selected');
        if (selectedFrames.length > 0) {
            const firstSelected = selectedFrames[0];
            const uuid = firstSelected.getAttribute("uuid");
            const img = this.pixelOnController.getImage(uuid).image;
            pskl.utils.FrameUtils.createFromImageSrc(
                img,
                false,
                this.overwriteCurrentFrameCallback_.bind(this)
            );
        }
    }

    // =================================================================
    //                            Tag Management
    // =================================================================

    ns.PixelOnDetailController.prototype.onTagInputKeyDown_ = function (container, event) {
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

    ns.PixelOnDetailController.prototype.onTagContainerClick_ = function (event) {
        if (event.target.classList.contains('tag-remove-button')) {
            this.removeTag_(event.target.parentElement);
        } else if (event.target.classList.contains('tag-input-container')) {
            event.target.querySelector('.tag-input').focus();
        }
    };

    ns.PixelOnDetailController.prototype.addTag_ = function (container, text) {
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

    ns.PixelOnDetailController.prototype.removeTag_ = function (tagElement) {
        tagElement.parentElement.removeChild(tagElement);
    };

    ns.PixelOnDetailController.prototype.clearTags_ = function (container) {
        var tags = container.querySelectorAll('.tag-item');
        tags.forEach(tag => this.removeTag_(tag));
    };

    ns.PixelOnDetailController.prototype.getTagsAsString_ = function (container) {
        var tags = [];
        container.querySelectorAll('.tag-item').forEach(tagElement => {
            tags.push(tagElement.firstChild.textContent.trim());
        });
        return tags.join(', ');
    };


    // =================================================================
    //                              Utiles
    // =================================================================
    ns.PixelOnDetailController.prototype.createImageCallback_ = function(frame) {
        this.piskelController.addFrameAtCurrentIndex();
        const targetFrame = this.piskelController.getCurrentFrame();
        this.drawFrameCentered_(targetFrame, frame);
    }

    ns.PixelOnDetailController.prototype.overwriteCurrentFrameCallback_ = function(frame) {
        const targetFrame = this.piskelController.getCurrentFrame();
        targetFrame.clear(); // Clear the frame before drawing
        this.drawFrameCentered_(targetFrame, frame);

        $.publish(Events.PISKEL_SAVE_STATE, {
            type: pskl.service.HistoryService.SNAPSHOT
        });
    }

    ns.PixelOnDetailController.prototype.drawFrameCentered_ = function (targetFrame, sourceFrame) {
        const targetWidth = targetFrame.getWidth();
        const targetHeight = targetFrame.getHeight();
        const sourceWidth = sourceFrame.getWidth();
        const sourceHeight = sourceFrame.getHeight();

        const offsetX = Math.floor((targetWidth - sourceWidth) / 2);
        const offsetY = Math.floor((targetHeight - sourceHeight) / 2);

        sourceFrame.forEachPixel(function (color, x, y) {
            if (color !== pskl.utils.colorToInt(Constants.TRANSPARENT_COLOR)) {
                targetFrame.setPixel(x + offsetX, y + offsetY, color);
            }
        });
    };

    ns.PixelOnDetailController.prototype.createSizeWarningElement_ = function () {
        var warningEl = document.createElement('span');
        warningEl.className = 'size-warning';
        warningEl.textContent = "Selected Image's size is bigger than Palette.";
        // This element is now only used to hold the text for the tooltip.
        warningEl.style.display = 'none';
        return warningEl;
    };

    /**
     * HistoryService.replayState 에서 호출되는 메서드.
     * SimplePen.replay(frame, replayData)와 같은 역할을 한다.
     *
     * @param {pskl.model.Frame} frame - HistoryService가 넘겨주는 프레임
     * @param {Object} replayData - 우리가 saveState 때 넘긴 replay 객체
     */
    ns.PixelOnDetailController.prototype.replay = function (frame, replayData) {
		console.log('PixelOn replay', replayData);
        if (replayData.kind === 'overwrite') {
            // 현재 프레임 덮어쓰기: frame 파라미터는 HistoryService에서
            // state.frameIndex / state.layerIndex 기준으로 찾아준 프레임
            frame.setPixels(replayData.pixels);
            $.publish(Events.FRAME_DID_UPDATE);

        } else if (replayData.kind === 'addFrames') {
            // 여러 프레임을 다시 추가
            // frame 파라미터는 무시하고 piskelController를 사용
            replayData.frames.forEach(function (f) {
                this.piskelController.addFrameAtCurrentIndex();
                var newFrame = this.piskelController.getCurrentFrame();
                newFrame.setPixels(f.pixels);
            }, this);
            $.publish(Events.FRAME_DID_UPDATE);
        }
    }
})();
