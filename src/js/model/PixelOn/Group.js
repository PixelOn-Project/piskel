(function () {
  var ns = $.namespace('pskl.model.PixelOn');

  /**
   * 사용자가 생성한 이미지 컬렉션(그룹).
   * @param {String} name - 그룹의 이름
   */
  ns.Group = function (name) {
    this.name = name;
    
    // 이 그룹에 포함된 이미지들의 UUID 목록 (데이터 중복 방지)
    this.datas =[];
  };
  // 그룹에 data 추가/제거 메서드
  ns.Group.prototype.addData = function (uuid) {
    if (!this.datas.includes(uuid)) {
      this.datas.push(uuid);
    }
  };
  ns.Group.prototype.removeData = function (uuid) {
    var index = this.datas.indexOf(uuid);
    if (index !== -1) {
      this.datas.splice(index, 1);
    }
  };
})();