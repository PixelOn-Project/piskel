(function () {
  var ns = $.namespace('pskl.model.PixelOn');

  /**
   * 하나의 AI 생성 세션.
   * @param {String} initialPrompt  - 이 세션을 시작한 최초의 대표 프롬프트
   * @param {Object} spec           - 생성 명세
   * @param {String} spec.p_prompt  - 긍정 프롬프트
   * @param {String} spec.n_prompt  - 부정 프롬프트
   * @param {Number} spec.seed      - 시드 값
   * @param {Number} spec.width     - 가로 크기
   * @param {Number} spec.height    - 세로 크기
   */
  ns.AiSession = function (initialPrompt, spec) {
    this.uuid = pskl.utils.Uuid.generate();
    this.createdAt = Date.now();

    this.prompt = initialPrompt || 'Untitled Session';
    this.spec = spec;
    
  };
  // Dialog 추가/조회 메서드
  ns.AiSession.prototype.addDialog = function (dialog) {
    this.Dialogs.push(dialog);
  };
  // 기타 필요한 getter 메서드 추가
  ns.AiSession.prototype.getUuid = function () {
    return this.uuid;
  };
  ns.AiSession.prototype.getCreatedAt = function () {
    return this.createdAt;
  };
  ns.AiSession.prototype.getPrompt = function () {
    return this.prompt;
  };
  ns.AiSession.prototype.getPPrompt = function() {
    return this.spec.p_prompt;
  }
  ns.AiSession.prototype.getNPrompt = function() {
    return this.spec.n_prompt;
  }
  ns.AiSession.prototype.getSeed = function() {
    return this.spec.seed;
  }
  ns.AiSession.prototype.getWidth = function() {
    return this.spec.width;
  }
  ns.AiSession.prototype.getHeight = function() {
    return this.spec.height;
  }
})();