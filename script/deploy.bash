
here=`pwd`

zip deployment.zip lambda_function.py
zip -r deployment.zip tasks

cd env/lib/python3.6/site-packages

zip -r $here/deployment.zip pymongo > /dev/null
zip -r $here/deployment.zip colorama
zip -r $here/deployment.zip bson
zip -r $here/deployment.zip pytz > /dev/null
zip $here/deployment.zip crayons.py

cd ~/git/aardvark

zip -r $here/deployment.zip aardvark

cd ~/git/elephant

zip -r $here/deployment.zip elephant

cd $here

pwd

python3 script/deploy.py $here/deployment.zip

python3 script/upload_website.py

