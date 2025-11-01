(function () {
    var ns = $.namespace('pskl.controller');

    /**
     * AI Generator Controller
     * (컨트롤러 이름은 HTML 포함 부분과 일치하도록 'AiGeneratorController'로 복원합니다.)
     */
    ns.AiGeneratorController = function (piskelController) {
        this.piskelController = piskelController;
    };

    ns.AiGeneratorController.prototype.init = function () {
        // 1. DOM 요소 가져오기: piskelapp의 HTML 구조에 맞게 쿼리 선택자 사용
        // (이전 HTML에서 AI 템플릿은 오른쪽 컬럼에 @@include('templates/ai-generator.html',{})로 포함되었습니다.)
        this.container = document.querySelector('.ai-generator-container'); // .ai-assistant-container 대신 .ai-generator-container를 사용했을 가능성이 높습니다.

        if (!this.container) {
            // Piskel의 다른 컨트롤러처럼, 컨테이너가 없으면 초기화 중단
            return;
        }

        // 2. 이벤트 리스너와 버튼 초기화는 내부 헬퍼 함수로 분리 (underscore 접미사 사용)
        this.initButtons_();
        this.initEventListeners_();
    };

    /**
     * AI 도우미 버튼에 이벤트 리스너를 바인딩합니다.
     */
    ns.AiGeneratorController.prototype.initButtons_ = function () {
        var buttons = this.container.querySelectorAll('.ai-generator-button');
        // ForEach 대신 Array.prototype.slice.call + forEach를 사용할 수도 있지만, 현대적인 ForEach로 유지합니다.
        buttons.forEach(function(button) {
            button.addEventListener('click', this.onButtonClick_.bind(this));
        }.bind(this));
    };

    /**
     * 전역 이벤트를 구독합니다.
     */
    ns.AiGeneratorController.prototype.initEventListeners_ = function () {
        // Piskel의 $.subscribe 패턴 사용
        $.subscribe(Events.PISKEL_RESET, this.onPiskelReset_.bind(this));
        $.subscribe(Events.PISKEL_LOADED, this.onPiskelLoaded_.bind(this));
    };

    /**
     * 버튼 클릭 이벤트를 처리합니다. (내부 함수이므로 _ 접미사 추가)
     */
    ns.AiGeneratorController.prototype.onButtonClick_ = function (event) {
        var button = event.currentTarget;
        var action = button.dataset.action;

        console.log('AI Generator action:', action);
        // TODO: Implement AI generator functionality
    };

    /**
     * Piskel 리셋 이벤트를 처리합니다. (내부 함수이므로 _ 접미사 추가)
     */
    ns.AiGeneratorController.prototype.onPiskelReset_ = function () {
        // Reset AI generator state
    };

    /**
     * Piskel 로드 이벤트를 처리합니다. (내부 함수이므로 _ 접미사 추가)
     */
    ns.AiGeneratorController.prototype.onPiskelLoaded_ = function () {
        // Update AI generator
    };

})();