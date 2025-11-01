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
    this.uuid = pskl.utils.Uuid.generate();
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
})();