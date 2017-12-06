
here=`pwd`

zip deployment.zip lambda_function.py
zip -r deployment.zip todo

cd `pipenv --venv`/lib/python3.5/site-packages

zip -r $here/deployment.zip pymongo
zip -r $here/deployment.zip colorama
zip -r $here/deployment.zip bson
zip -r $here/deployment.zip pytz
zip $here/deployment.zip crayons.py


cp $here/deployment.zip /media/sf_Documents


