(function () {
  var ns = $.namespace('pskl.model');

  /**
   * PixelOn 애드온의 전체 상태를 관리하는 최상위 모델.
   */
  ns.PixelOn = function () {
    // --- 기본 설정 ---
    this.width = 64;
    this.height = 64;
    this.generate_count = 8;

    // --- 데이터 저장소 ---

    /**
     * 생성된 모든 Image 객체를 저장하는 중앙 저장소 (Key-Value 형태).
     * Key: Image UUID, Value: pskl.model.PixelOn.Image 인스턴스
     * @type {Object<String, pskl.model.PixelOn.Image>}
     */
    this.imageStore = {};

    /**
     * 사용자가 생성한 이미지 그룹(라이브러리) 목록.
     * @type {Array<pskl.model.PixelOn.Group>}
     */
    this.library =[];

    /**
     * AI 생성 세션 기록 목록.
     * @type {Array<pskl.model.PixelOn.AiSession>}
     */
    this.sessions =[];
  };
})();