(function () {
  var ns = $.namespace('pskl.model.PixelOn');

  /**
   * 생성된 단일 이미지를 나타내는 객체.
   * 모든 Image 객체는 PixelOn 모델의 imageStore에 UUID를 키로 하여 저장됩니다.
   * @param {String} dataURL - Base64로 인코딩된 이미지 데이터
   */
  ns.Image = function (dataURL) {
    // 이 이미지의 고유 식별자
    this.uuid = pskl.utils.Uuid.generate();
    // Base64 이미지 데이터
    this.data = dataURL;
  };
})();