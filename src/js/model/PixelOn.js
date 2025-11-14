(function () {
  var ns = $.namespace('pskl.model');

  /**
   * PixelOn 애드온의 전체 상태를 관리하는 최상위 모델.
   */
  ns.PixelOn = function (width, height, generate_count) {
    if (width && height && generate_count != null) {
      // --- 기본 설정 ---
      this.width = width;
      this.height = height;
      this.generate_count = generate_count;
      /**
       * 생성된 모든 Image 객체를 저장하는 중앙 저장소 (Key-Value 형태).
       * Key: Image UUID, Value: pskl.model.PixelOn.Image 인스턴스
       */
      this.imageStore = new Map();
      /**
       * AI 생성 세션 기록 목록.
       * @type {Array<pskl.model.PixelOn.AiSession>}
       */
      this.sessions = [];
    } else {
      throw 'Missing arguments in PixelOn constructor : ' + Array.prototype.join.call(arguments, ',');
    }
  };

  /**
   * 기본적인 getter/setter method
   */
  ns.PixelOn.prototype.getWidth = function () {
    return this.width;
  };
  ns.PixelOn.prototype.getHeight = function () {
    return this.height;
  };
  ns.PixelOn.prototype.getGenerateCount = function () {
    return this.generate_count;
  };
  ns.PixelOn.prototype.setWidth = function (width) {
    this.width = width;
  };
  ns.PixelOn.prototype.setHeight = function (height) {
    this.height = height;
  };
  ns.PixelOn.prototype.setGenerateCount = function (count) {
    this.generate_count = count;
  };
  // 이미지 저장소에 이미지 추가/조회 메서드
  ns.PixelOn.prototype.addImageToStore = function (image) {
    // uuid 모듈을 사용하여 고유한 식별자 생성 후 imageStore에 저장
    const uuid = pskl.utils.Uuid.generate();
    this.imageStore.set(uuid, image);
    return uuid;
  };
  ns.PixelOn.prototype.addImageToStore = function (uuid, image) {
    return this.imageStore.set(uuid, image);
  };
  ns.PixelOn.prototype.getImageFromStore = function (uuid) {
    return this.imageStore.get(uuid);
  };
  // 초기 prompt와 spec을 받으면, 새로운 AiSession을 생성합니다.
  ns.PixelOn.prototype.createSession = function (init_prompt, spec) {
    const session = new pskl.model.PixelOn.AiSession(init_prompt, spec)
    this.sessions.push(session);
    return session;
  };
  ns.PixelOn.prototype.getSessionList = function() {
    return this.sessions
  }
  /**
   * session의 index를 이용해 1개의 session을 Array에서 제거합니다.
   * @param {Number} session_index 
   */
  ns.PixelOn.prototype.removeSessionList = function(session_index) {
    if (session_index >= 0 && session_index < this.sessions.length)
      this.sessions.splice(session_index, 1)
  }
})();