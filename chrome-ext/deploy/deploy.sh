#! /bin/bash

#make baseUrl production url, update the manifest count
python deploy/deploy.py

#remove old zip and add new one
cd ../
rm chrome-ext.zip
zip -r chrome-ext.zip chrome-ext/