(function () {
  var ns = $.namespace('pskl.controller.pixelOn');

  /**
   * PixelOn 애드온의 데이터 모델을 총괄하는 메인 컨트롤러.
   */
  ns.PixelOnController = function (pixelOn) {
    if (pixelOn) {
      this.setPixelOn(pixelOn);
    } else {
      throw 'A piskel instance is mandatory for instanciating PiskelController';
    }
  };

  /**
   * 새로운 PixelOn 모델로 설정
   * @param {Object} pixelOn
   */
  ns.PixelOnController.prototype.setPixelOn = function(pixelOn) {
    this.pixelOn = pixelOn;
  };

  ns.PixelOnController.prototype.init = function () {    
  };

  // =================================================================
  //                             GETTERS
  // =================================================================
  ns.PixelOnController.prototype.getPixelOn = function() {
    return this.pixelOn;
  }
  ns.PixelOnController.prototype.getWidth = function () {
    return this.pixelOn.getWidth();
  };
  ns.PixelOnController.prototype.getHeight = function () {
    return this.pixelOn.getHeight();
  };
  ns.PixelOnController.prototype.getGenerateCount = function () {
    return this.pixelOn.getGenerateCount();
  };
  ns.PixelOnController.prototype.getImage = function (uuid) {
    return this.pixelOn.getImage(uuid);
  };
  ns.PixelOnController.prototype.getSessions = function () {
    return this.pixelOn.getSessions();
  }
  ns.PixelOnController.prototype.getSessionAt = function(index) {
    var sessions = this.getSessions();
    if (index >= 0 && index < sessions.length) {
      return sessions[index];
    }
    return null;
  }
  ns.PixelOnController.prototype.getSessionByUuid = function(uuid) {
    const sessions = this.getSessions();
    const obj = sessions.find((session) => session.getUuid() == uuid);
    return obj;
  }

  // =================================================================
  //                             SETTERS / MODIFIERS
  // =================================================================
  ns.PixelOnController.prototype.setWidth = function(width) {
    this.pixelOn.setWidth(width);
  };
  ns.PixelOnController.prototype.setHeight = function(height) {
    this.pixelOn.setHeight(height);
  };
  ns.PixelOnController.prototype.setGenerateCount = function(count) {
    this.pixelOn.setGenerateCount(count);
  };
  ns.PixelOnController.prototype.addImage = function(image, spec) {
    const uuid = pskl.utils.Uuid.generate();
    this.pixelOn.addImage(uuid, {
      image: image,
      spec: spec,
    });
    return uuid;
  };
  ns.PixelOnController.prototype.addSession = function(session) {
    this.pixelOn.addSession(session);
  };
  ns.PixelOnController.prototype.removeSession = function(session) {
    this.pixelOn.removeSession(session);
  };
  ns.PixelOnController.prototype.removeSessionAt = function(index) {
    this.pixelOn.removeSessionAt(index);
  };
  ns.PixelOnController.prototype.removeSessionByUuid = function(uuid) {
    var session = this.getSessionByUuid(uuid);
    if (session) {
      this.removeSession(session);
    }
  };
  ns.PixelOnController.prototype.renameSession = function(uuid, name) {
    const session = this.getSessionByUuid(uuid);
    if (session) {
      session.setName(name);
    }
  };
   
})();