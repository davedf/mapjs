rm -rf lib 

mkdir -p lib 

curl http://ajax.googleapis.com/ajax/libs/jquery/1.9.0/jquery.min.js > lib/jquery-1.9.0.js 
curl http://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.4.3/underscore-min.js > lib/underscore-1.4.3-min.js
curl http://mindmup.s3.amazonaws.com/lib/kinetic-v4.2.0-custom-min.js > lib/kinetic-v4.2.0-custom-min.js
curl https://raw.github.com/brandonaaron/jquery-mousewheel/master/jquery.mousewheel.js > lib/jquery.mousewheel.js
version=`grep Version  lib/jquery.mousewheel.js | tr -d -C "0-9."`
mv lib/jquery.mousewheel.js lib/jquery.mousewheel-$version.js
curl http://cloud.github.com/downloads/harthur/color/color-0.4.1.min.js > lib/color-0.4.1.min.js
