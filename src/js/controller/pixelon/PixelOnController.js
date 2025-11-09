(function () {
  var ns = $.namespace('pskl.controller');

  /**
   * PixelOn 애드온의 데이터 모델을 총괄하는 메인 컨트롤러.
   */
  ns.PixelOnController = function (pixelOn) {
    this.pixelOn = pixelOn;
  };

  /**
   * 새로운 PixelOn 모델로 컨트롤러를 초기화하거나 리셋합니다.
   * @param {Number} width
   * @param {Number} height
   * @param {Number} generate_count
   */
  ns.PixelOnController.prototype.init = function () {
    //this.pixelOn = new pskl.model.PixelOn(width, height, generate_count);
    //this.publishEvent_(Events.PIXELON_STATE_LOADED);
    
  };

  // =================================================================
  //                             GETTERS
  // =================================================================

  /**
   * 현재 PixelOn 모델 인스턴스를 반환합니다.
   * @return {pskl.model.PixelOn}
   */
  ns.PixelOnController.prototype.getPixelOn = function () {
    return this.pixelOn;
  };

  ns.PixelOnController.prototype.getWidth = function () {
    return this.pixelOn.getWidth();
  };

  ns.PixelOnController.prototype.getHeight = function () {
    return this.pixelOn.getHeight();
  };

  ns.PixelOnController.prototype.getGenerateCount = function () {
    return this.pixelOn.getGenerateCount();
  };

  ns.PixelOnController.prototype.getImageByUuid = function (uuid) {
    return this.pixelOn.imageStore[uuid];
  };

  ns.PixelOnController.prototype.getSessionByUuid = function (uuid) {
    // 모델 코드의 getSessionById가 'id'를 사용하지만, 모델 전반적으로 'uuid'를 사용하므로
    // 여기서 'uuid'를 사용하도록 수정하여 일관성을 유지합니다.
    for (var i = 0; i < this.pixelOn.sessions.length; i++) {
      if (this.pixelOn.sessions[i].uuid === uuid) {
        return this.pixelOn.sessions[i];
      }
    }
    return null;
  };

  // =================================================================
  //                             SETTERS / MODIFIERS
  // =================================================================

  /**
   * 새로운 PixelOn 모델 객체로 현재 상태를 교체합니다. (예: 파일에서 로드 시)
   * @param {pskl.model.PixelOn} newPixelOn
   */
  ns.PixelOnController.prototype.setCurrentPixelOn = function (newPixelOn) {
    this.pixelOn = newPixelOn;
    this.publishEvent_(Events.PIXELON_STATE_LOADED);
  };

  /**
   * 새로운 세션을 생성하고 모델에 추가합니다.
   * @param {String} name 세션의 이름
   * @return {pskl.model.PixelOn.AiSession} 생성된 세션 객체
   */
  ns.PixelOnController.prototype.createSession = function (name) {
    var session = new pskl.model.PixelOn.AiSession(name);
    this.pixelOn.addSession(session);
    this.publishEvent_(Events.PIXELON_SESSION_CREATED);
    return session;
  };

  /**
   * 특정 세션에 새로운 Dialog를 추가합니다.
   * @param {String} sessionId Dialog를 추가할 세션의 UUID
   * @param {Object} spec Dialog 생성에 필요한 데이터 (prompts, seed 등)
   * @return {pskl.model.PixelOn.Dialog} 생성된 Dialog 객체
   */
  ns.PixelOnController.prototype.addDialogToSession = function (sessionId, spec) {
    var session = this.getSessionByUuid(sessionId);
    if (!session) {
      console.error('Session not found for id:', sessionId);
      return null;
    }
    var dialog = new pskl.model.PixelOn.Dialog(spec);
    session.Dialogs.push(dialog);
    this.publishEvent_(Events.PIXELON_DIALOG_CREATED);
    return dialog;
  };

  /**
   * 새로운 이미지를 생성하고 중앙 저장소에 추가한 뒤, 해당 Dialog에 연결합니다.
   * @param {String} dataURL Base64 이미지 데이터
   * @param {String} dialogId 이미지가 속한 Dialog의 UUID
   * @return {pskl.model.PixelOn.Image} 생성된 Image 객체
   */
  ns.PixelOnController.prototype.createImage = function (dataURL, dialogId) {
    var dialog = this.getDialogByUuid_(dialogId); // 내부 헬퍼 함수 필요
    if (!dialog) {
      console.error('Dialog not found for id:', dialogId);
      return null;
    }

    var image = new pskl.model.PixelOn.Image(dataURL, dialogId);

    // 1. 중앙 저장소(imageStore)에 완전한 Image 객체 저장
    this.pixelOn.imageStore[image.uuid] = image;

    // 2. Dialog에는 이미지의 UUID만 저장하여 관계를 맺음
    dialog.images.push(image.uuid);

    this.publishEvent_(Events.PIXELON_IMAGE_CREATED);
    return image;
  };

  // =================================================================
  //                         PRIVATE HELPER METHODS
  // =================================================================

  /**
   * 모든 세션을 순회하여 특정 UUID를 가진 Dialog를 찾습니다.
   * @param {String} uuid 찾을 Dialog의 UUID
   * @return {pskl.model.PixelOn.Dialog | null}
   */
  ns.PixelOnController.prototype.getDialogByUuid_ = function (name) {
    for (var i = 0; i < this.pixelOn.sessions.length; i++) {
      var session = this.pixelOn.sessions[i];
      for (var j = 0; j < session.Dialogs.length; j++) {
        var dialog = session.Dialogs[j];
        if (dialog.uuid === uuid) {
          return dialog;
        }
      }
    }
    return null;
  };

  /**
   * 모델 상태가 변경되었음을 알리는 이벤트를 발행합니다.
   * @param {String} eventName 발행할 이벤트의 이름
   */
  ns.PixelOnController.prototype.publishEvent_ = function (eventName) {
    $.publish(eventName);
    // 모든 변경사항을 포괄하는 범용 이벤트도 함께 발행
    $.publish(Events.PIXELON_STATE_CHANGED);
  };

})();