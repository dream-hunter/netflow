#!/bin/bash

echo 'netflow-update.sh' > .gitignore
echo 'config.json' >> .gitignore
echo 'config.php' >> .gitignore

rm -fr .git
git init
git remote add origin https://github.com/dream-hunter/netflow.git
git fetch origin
git checkout origin/main -ft
