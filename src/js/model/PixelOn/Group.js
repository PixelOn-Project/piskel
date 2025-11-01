(function () {
  var ns = $.namespace('pskl.model.PixelOn');

  /**
   * 사용자가 생성한 이미지 컬렉션(그룹).
   * @param {String} name - 그룹의 이름
   */
  ns.Group = function (name) {
    this.uuid = pskl.utils.Uuid.generate();
    this.name = name;

    // 이 그룹에 포함된 이미지들의 UUID 목록 (데이터 중복 방지)
    this.datas =[];
  };
})();