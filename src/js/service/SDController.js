(function () {
    var ns = $.namespace('pskl.service');

    ns.SDController = function(baseUrl) {
        this.baseUrl = baseUrl || "http://127.0.0.1:5000";
        this.pixelOnController = pskl.app.pixelOnController;
        this.heartbeatInterval = null;
        this.isConnected = false;
        this.isGenerating = false;
        this.abortController = null;

        this.callbacks = {
            onProgress: {},
            onImage: {},
            onDone: {},
            onError: {}
        };
    };

    /**
     * Register callbacks from other controllers to update the UI.
     * @param {String} id - A unique ID to identify the callback.
     * @param {Object} callbacks - An object containing onProgress, onImage, onDone, onError functions.
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
    };

    /**
     * Unregister a set of callbacks.
     * @param {String} id - The unique ID of the callbacks to unregister.
     */
    ns.SDController.prototype.unregisterCallbacks = function(id) {
        if (!id) return;
        for (var key in this.callbacks) {
            if (this.callbacks[key].hasOwnProperty(id)) {
                delete this.callbacks[key][id];
            }
        }
    };

    /**
     * Start image generation.
     * @param {Object} spec - Parameters for generation (prompts, size, etc.).
     * @param {String} sessionId - The current session ID.
     */
    ns.SDController.prototype.generate = async function (spec, sessionId) {
        if (this.isGenerating) {
            this._broadcast('onError', 'A generation is already in progress.');
            return;
        }

        this.isGenerating = true;
        this.abortController = new AbortController();
        this._broadcast('onProgress', true, 'Connecting to server...', sessionId);

        try {
            const requestBody = {
                session_id: sessionId,
                spec: spec
            };

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
     * Stop image generation.
     * @param {String} sessionId - The session ID to stop.
     */
    ns.SDController.prototype.stop = async function (sessionId) {
        if (!this.isGenerating) return;

        if (this.abortController) {
            this.abortController.abort();
        }

        try {
            await fetch(`${this.baseUrl}/api/stop`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ session_id: sessionId })
            });
        } catch (error) {
            console.error('[SDController] Failed to send stop request:', error);
        }
    };

    /**
     * Process the Server-Sent Events (SSE) stream.
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
     * Handle a received SSE event and trigger callbacks.
     * @private
     */
    ns.SDController.prototype._handleSseEvent = function (eventData) {
        try {
            const data = JSON.parse(eventData);

            switch (data.type) {
                case 'image':
                    const session = this.pixelOnController.getSessionByUuid(data.session_id);
                    if (session) {
                        const fullBase64 = `data:image/png;base64,${data.image_base64}`;
                        const imgUuid = this.pixelOnController.addImage(fullBase64, data.spec);
                        session.addImageUuid(imgUuid);
                        data.imgUuid = imgUuid;
                    } else {
                        console.error(`[SDController] Session not found for session_id: ${data.session_id}`);
                    }
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
     * Broadcast an event to all registered callbacks.
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
    //                         Heartbeat
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
                this.isConnected = true;
            } else if (!response.ok && this.isConnected) {
                this.isConnected = false;
            }
        } catch (error) {
            if (this.isConnected) {
                this.isConnected = false;
            }
        }
    };
}());
