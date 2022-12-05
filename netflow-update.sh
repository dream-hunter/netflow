#!/bin/bash

echo 'config.json' > .gitignore
echo 'config.php' >> .gitignore
echo 'macdb.php.html' >> .gitignore

rm -fr .git
git init
git remote add origin https://github.com/dream-hunter/netflow.git
git fetch origin
git checkout origin/main -ft
