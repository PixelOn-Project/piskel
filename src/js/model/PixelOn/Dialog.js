(function () {
  var ns = $.namespace('pskl.model.PixelOn');

  /**
   * 단일 AI 생성 요청과 를 나타내는 객체.
   * @param {Object} spec - 생성 명세
   * @param {String} spec.p_prompt - 긍정 프롬프트
   * @param {String} spec.n_prompt - 부정 프롬프트
   * @param {Number} spec.seed - 시드 값
   * @param {Number} spec.width - 가로 크기
   * @param {Number} spec.height - 세로 크기
   * @param {Object} spec.details - 기타 AI 입력 파라미터
   */
  ns.Dialog = function (spec) {
    this.createdAt = Date.now();
    this.p_prompt = spec.p_prompt || '';
    this.n_prompt = spec.n_prompt || '';
    this.seed = spec.seed || 0;
    this.width = spec.width;
    this.height = spec.height;
    this.details = spec.details || {};

    // 이 Dialog에서 생성된 이미지들의 UUID 목록 (데이터 중복 방지 + 담긴 순서대로 출력)
    this.images =[];
  };
  //필요한 모든 getter setter 메서드 추가
  ns.Dialog.prototype.addImage = function (uuid) {
    if (!this.images.includes(uuid)) {
      this.images.push(uuid);
    }
  };
  ns.Dialog.prototype.getImages = function () {
    return this.images;
  };
  ns.Dialog.prototype.getPrompt = function () {
    return this.p_prompt;
  };
  ns.Dialog.prototype.getNegativePrompt = function () {
    return this.n_prompt;
  };
  ns.Dialog.prototype.getSeed = function () {
    return this.seed;
  };
  ns.Dialog.prototype.getWidth = function () {
    return this.width;
  };
  ns.Dialog.prototype.getHeight = function () {
    return this.height;
  };
  ns.Dialog.prototype.getDetails = function () {
    return this.details;
  };

  // spec 통째로 반환
  ns.Dialog.prototype.getSpec = function () {
    return {
      p_prompt : this.p_prompt,
      n_prompt : this.n_prompt,
      seed : this.seed,
      width : this.width,
      height : this.height,
      details : this.details
    };
  };
})();