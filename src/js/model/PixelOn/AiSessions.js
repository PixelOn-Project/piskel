(function () {
  var ns = $.namespace('pskl.model.PixelOn');

  /**
   * 하나의 큰 주제나 아이디어의 흐름을 나타내는 AI 생성 세션.
   * 여러 개의 Dialog(생성 시도)를 포함합니다.
   * @param {String} initialPrompt - 이 세션을 시작한 최초의 대표 프롬프트
   */
  ns.AiSession = function (initialPrompt) {
    this.uuid = pskl.utils.Uuid.generate();
    this.createdAt = Date.now();

    this.prompt = initialPrompt || 'Untitled Session';

    /**
     * 이 세션에 속한 모든 생성 시도(Dialog)의 목록
     * @type {Array<pskl.model.PixelOn.Dialog>}
     */
    this.Dialogs ={};
  };
})();