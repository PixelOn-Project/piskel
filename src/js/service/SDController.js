(function () {
    var ns = $.namespace('pskl.service');

    ns.SDController = function(baseUrl) {
        this.baseUrl = baseUrl || "http://127.0.0.1:5000";
        this.pixelOnController = pskl.app.pixelOnController;
        this.heartbeatInterval = null;
        this.isConnected = false;
        this.isGenerating = false;
        this.abortController = null;

        // 콜백을 저장할 객체. 이제 여러 콜백을 ID로 관리합니다.
        this.callbacks = {
            onProgress: {},
            onImage: {},
            onDone: {},
            onError: {}
        };
    };

    /**
     * 외부 컨트롤러에서 UI 업데이트를 위한 콜백을 등록합니다.
     * @param {String} id - 콜백을 식별하기 위한 고유 ID.
     * @param {Object} callbacks - onProgress, onImage, onDone, onError 콜백 함수를 포함하는 객체.
     */
    ns.SDController.prototype.registerCallbacks = function(id, callbacks) {
        if (!id) {
            console.error("[SDController] Registration failed: ID is required.");
            return;
        }
        for (var key in callbacks) {
            if (this.callbacks.hasOwnProperty(key)) {
                this.callbacks[key][id] = callbacks[key];
            }
        }
        console.log("[SDController] Callbacks registered for ID:", id);
    };

    /**
     * 등록된 콜백을 해제합니다.
     * @param {String} id - 해제할 콜백의 고유 ID.
     */
    ns.SDController.prototype.unregisterCallbacks = function(id) {
        if (!id) return;
        for (var key in this.callbacks) {
            if (this.callbacks[key].hasOwnProperty(id)) {
                delete this.callbacks[key][id];
            }
        }
        console.log("[SDController] Callbacks unregistered for ID:", id);
    };

    /**
     * 이미지 생성을 시작합니다.
     * @param {Object} spec - 생성에 필요한 파라미터 (프롬프트, 크기 등)
     * @param {String} sessionId - 현재 작업 세션 ID
     */
    ns.SDController.prototype.generate = async function (spec, sessionId) {
        if (this.isGenerating) {
            console.warn("[SDController] Generation is already in progress.");
            this._broadcast('onError', 'A generation is already in progress.');
            return;
        }

        console.log("%c[SDController] Preparing to send data to AI Server:", "color: lightblue; font-weight: bold;");
        console.log("Session ID:", sessionId);
        console.log("Specification (spec):", spec);

        this.isGenerating = true;
        this.abortController = new AbortController();
        this._broadcast('onProgress', true, 'Connecting to server...', sessionId);

        try {
            const requestBody = {
                session_id: sessionId,
                spec: spec
            };

            console.log("%c[SDController] Sending JSON to /api/generate:", "color: lightgreen; font-weight: bold;");
            console.log(JSON.stringify(requestBody, null, 2));

            const response = await fetch(`${this.baseUrl}/api/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
                signal: this.abortController.signal
            });

            if (!response.ok) {
                throw new Error(`Server error: ${response.status} ${response.statusText}`);
            }

            this._broadcast('onProgress', true, 'Waiting for stream data...', sessionId);
            await this._processStream(response.body, sessionId);

        } catch (error) {
            if (error.name === 'AbortError') {
                this._broadcast('onProgress', false, 'Generation cancelled.', sessionId);
                this._broadcast('onError', 'Generation cancelled.');
            } else {
                this._broadcast('onProgress', false, `Error: ${error.message}`, sessionId);
                this._broadcast('onError', error.message);
            }
            this.isGenerating = false;
        }
    };

    /**
     * 이미지 생성을 중단합니다.
     * @param {String} sessionId - 중단할 세션 ID
     */
    ns.SDController.prototype.stop = async function (sessionId) {
        if (!this.isGenerating) return;

        if (this.abortController) {
            this.abortController.abort(); // Abort the fetch request
        }

        console.log("%c[SDController] Sending stop request for session:", "color: orange; font-weight: bold;", sessionId);

        try {
            await fetch(`${this.baseUrl}/api/stop`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ session_id: sessionId })
            });
            console.log("[SDController] Stop request sent.");
        } catch (error) {
            console.error('[SDController] Failed to send stop request:', error);
        }
    };

    /**
     * SSE 스트림을 처리합니다.
     * @private
     */
    ns.SDController.prototype._processStream = async function (stream, sessionId) {
        const reader = stream.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { value, done } = await reader.read();
            if (done) {
                if (this.isGenerating) {
                    this._broadcast('onProgress', false, 'Stream ended unexpectedly.', sessionId);
                    this._broadcast('onError', 'Stream ended unexpectedly.');
                    this.isGenerating = false;
                }
                break;
            }

            buffer += decoder.decode(value, { stream: true });
            const events = buffer.split('\n\n');
            buffer = events.pop();

            for (const event of events) {
                if (event.startsWith('data:')) {
                    this._handleSseEvent(event.substring(5).trim());
                }
            }
        }
    };

    /**
     * 수신된 SSE 이벤트를 처리하고 콜백을 호출합니다.
     * @private
     */
    ns.SDController.prototype._handleSseEvent = function (eventData) {
        try {
            const data = JSON.parse(eventData);
            console.log("%c[SDController] Received SSE event:", "color: cyan; font-weight: bold;", data);

            switch (data.type) {
                case 'image':
                    // 1. Save the image data to the central model first.
                    const session = this.pixelOnController.getSessionByUuid(data.session_id);
                    if (session) {
                        const fullBase64 = `data:image/png;base64,${data.image_base64}`;
                        const imgUuid = this.pixelOnController.addImage(fullBase64, data.spec);
                        session.addImageUuid(imgUuid);
                        // Add the new image's UUID to the data object to pass to callbacks.
                        data.imgUuid = imgUuid;
                    } else {
                        console.error(`[SDController] Session not found for session_id: ${data.session_id}`);
                    }

                    // 2. Notify UI controllers.
                    this._broadcast('onProgress', true, `Generating... (${data.current_index}/${data.total_count})`, data.session_id);
                    this._broadcast('onImage', data);
                    break;
                case 'done':
                    this.isGenerating = false;
                    this._broadcast('onProgress', false, `Generation finished: ${data.status}`, data.session_id);
                    this._broadcast('onDone', data);
                    break;
                case 'error':
                    this.isGenerating = false;
                    this._broadcast('onProgress', false, `Server error: ${data.message}`, data.session_id);
                    this._broadcast('onError', data.message);
                    break;
            }
        } catch (e) {
            console.error('[SDController] Failed to parse SSE event:', eventData, e);
            this._broadcast('onError', 'Failed to parse server event.');
        }
    };

    /**
     * 등록된 모든 콜백에 이벤트를 전달합니다.
     * @private
     */
    ns.SDController.prototype._broadcast = function(callbackType, ...args) {
        const callbacksForType = this.callbacks[callbackType];
        for (var id in callbacksForType) {
            if (typeof callbacksForType[id] === 'function') {
                try {
                    callbacksForType[id](...args);
                } catch (e) {
                    console.error(`[SDController] Error in callback ${id} for ${callbackType}:`, e);
                }
            }
        }
    };

    // =================================================================
    //                         Heartbeat (기존 코드)
    // =================================================================

    ns.SDController.prototype.startHeartbeat = function(intervalMs) {
        intervalMs = intervalMs || 2000;
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }
        var self = this;
        this._sendHeartbeat();
        this.heartbeatInterval = setInterval(function() {
            self._sendHeartbeat();
        }, intervalMs);
    };

    ns.SDController.prototype.stopHeartbeat = function() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    };

    ns.SDController.prototype._sendHeartbeat = async function() {
        try {
            var response = await fetch(this.baseUrl + '/api/heartbeat', {
                method: "POST",
                headers: { "Content-Type": "application/json" }
            });
            if (response.ok && !this.isConnected) {
                console.log("[SDController] Server connected.");
                this.isConnected = true;
            } else if (!response.ok && this.isConnected) {
                console.warn('[SDController] Heartbeat failed: ' + response.status);
                this.isConnected = false;
            }
        } catch (error) {
            if (this.isConnected) {
                console.error("[SDController] Server unreachable.");
                this.isConnected = false;
            }
        }
    };
}());
