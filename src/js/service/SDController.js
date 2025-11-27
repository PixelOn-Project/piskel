(function () {
    var ns = $.namespace('pskl.service');

    ns.SDController = function(baseUrl) {
        // 기본값 설정
        this.baseUrl = baseUrl || "http://127.0.0.1:5000";
        this.heartbeatInterval = null;
        this.isConnected = false;
    }

    /**
     * Heartbeat 전송 시작
     * @param {number} intervalMs - 전송 간격 (기본값: 2000ms = 2초)
     */
    ns.SDController.prototype.startHeartbeat = function(intervalMs) {
        // 기본값 처리
        intervalMs = intervalMs || 2000;

        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }

        console.log('[SDController] Heartbeat started (Interval: ' + intervalMs + 'ms)');

        // this 컨텍스트 유지를 위한 변수 할당 (또는 bind 사용)
        var self = this;

        // 즉시 1회 실행
        this._sendHeartbeat();

        // 주기적 실행
        this.heartbeatInterval = setInterval(function() {
            self._sendHeartbeat();
        }, intervalMs);
    };

    /**
     * Heartbeat 전송 중지
     */
    ns.SDController.prototype.stopHeartbeat = function() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
            console.log("[SDController] Heartbeat stopped.");
        }
    };

    /**
     * (내부 함수) 실제 서버로 요청 전송
     */
    ns.SDController.prototype._sendHeartbeat = async function() {
        var self = this;
        try {
            var response = await fetch(this.baseUrl + '/api/heartbeat', {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                }
            });

            if (response.ok) {
                if (!self.isConnected) {
                    console.log("[SDController] Server connected.");
                    self.isConnected = true;
                }
            } else {
                console.warn('[SDController] Heartbeat failed: ' + response.status);
                self.isConnected = false;
            }
        } catch (error) {
            // 서버가 꺼져있거나 네트워크 오류 시
            if (self.isConnected) {
                console.error("[SDController] Server unreachable.");
                self.isConnected = false;
            }
        }
    };
    
}());