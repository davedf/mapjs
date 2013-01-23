rm -rf lib 

mkdir -p lib 

curl http://ajax.googleapis.com/ajax/libs/jquery/1.9.0/jquery.min.js > lib/jquery-1.9.0.js 
curl http://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.4.3/underscore-min.js > lib/underscore-1.4.3-min.js
curl http://mindmup.s3.amazonaws.com/lib/kinetic-v4.2.0-custom-min.js > lib/kinetic-v4.2.0-custom-min.js
