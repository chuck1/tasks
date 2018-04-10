
here=`pwd`

zip deployment.zip lambda_function.py
zip -r deployment.zip todo

cd env/lib/python3.6/site-packages

zip -r $here/deployment.zip pymongo > /dev/null
#zip -r $here/deployment.zip colorama
zip -r $here/deployment.zip bson
zip -r $here/deployment.zip pytz > /dev/null
zip $here/deployment.zip crayons.py

cp $here/deployment.zip /media/sf_Documents

cd $here

pwd

python3 script/deploy.py $here/deployment.zip

python3 script/upload_website.py

