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
       * 사용자가 생성한 이미지 그룹(라이브러리) 목록.
       * @type {Array<pskl.model.PixelOn.Group>}
       */
      this.library =[];
      /**
       * AI 생성 세션 기록 목록.
       * @type {Array<pskl.model.PixelOn.AiSession>}
       */
      this.sessions =[];
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
  // 라이브러리(그룹) 추가/조회 메서드
  /**
   * group 객체를 라이브러리에 추가합니다.
   * @param {pskl.model.PixelOn.Group} group 
   */
  ns.PixelOn.prototype.addGroupToLibrary = function (group) {
    this.library.push(group);
  };
  /**
   * 이름으로 그룹을 조회합니다.
   * @param {String} name
   * @return {pskl.model.PixelOn.Group|null}
   * 이름에 해당하는 그룹이 없으면 null 반환
   */
  ns.PixelOn.prototype.getGroupByName = function (name) {
    for (var i = 0; i < this.library.length; i++) {
      if (this.library[i].name === name) {
        return this.library[i];
      }
    }
    return null;
  };
  /**
   * 그룹명과 image uuid가 주어지면, 해당 그룹에 이미지를 추가합니다.
   * @param {String} groupName 
   * @param {String} imageUuid 
   */
  ns.PixelOn.prototype.addImageToGroup = function (groupName, imageUuid) {
    var group = this.getGroupByName(groupName);
    if (group) {
      group.addData(imageUuid);
    }
  };
  // 동일한 방식으로 세션 추가/조회 메서드를 구현해라.
  ns.PixelOn.prototype.addSession = function (session) {
    this.sessions.push(session);
  };
  ns.PixelOn.prototype.getSessionById = function (id) {
    for (var i = 0; i < this.sessions.length; i++) {
      if (this.sessions[i].id === id) {
        return this.sessions[i];
      }
    }
    return null;
  };
})();