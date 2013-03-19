/**
 *  This should work in the browser with no modification,
 *  this means that it might be possible to resize images client side!
 *
 *  Think of the bandwidth!
 */
module.exports = function() {

  var self = {}

  // src, $outputFile, $width, $height, $wOffset, $hOffset, $srcWidth, $srcHeight
  // image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight
  self.crop = function (src, img, canvas) {
    img.onerror = self.onerror

    img.onload = function () {

      // $size = getimagesize($inputFile);

      // if ($width == null && $height == null) {
      //   if ($inputFile != $outputFile) {
      //     copy($inputFile, $outputFile);
      //   }
      //   return true;
      // }

      // switch($size[2]) {
      //   case 1:
      //     $imageSrc = imagecreatefro(image, x,mgif($inputFile);
      //     break;
      //   case 2:
      //     $imageSrc = imagecreatefromjpeg($inputFile);
      //     break;
      //   case 3:
      //     $imageSrc = imagecreatefrompng($inputFile);
      //     break;
      //   default:
      //     $application = &CoreFactory::getApplication();
      //     $application->errorControl->addError(
      //       "'$inputFile' is not a valid image. Image must be a Jpeg, Gif or Png");
      //     return false;
      // }

      // $imageDst = imagecreatetruecolor($width, $height);
      // imagecopyresampled($imageDst, $imageSrc, 0, 0, $wOffset, $hOffset, $width, $height, $srcWidth, $srcHeight);

      // clearstatcache();
      // $size = getimagesize($inputFile);
      // switch($size[2]) {
      //   case 1:
      //     imagegif ($imageDst, $outputFile, IMG_QUALITY);
      //     break;
      //   case 2:
      //     imagejpeg($imageDst, $outputFile, IMG_QUALITY);
      //     break;
      //   case 3:
      //     imagepng($imageDst, $outputFile);
      //     break;
      // }
      // return array($width, $height);

    }

    img.src = src
  }


  self.onload = function () {}
  self.onerror = function () {}

  return self
}