#!/bin/zsh

datevar=$(date +'%Y%m%d')
VERSION="$(node -pe 'JSON.parse(process.argv[1]).version' "$(cat ./package.json)")"
mkdir -p HotUpdate/$VERSION/ios/$datevar
mkdir -p HotUpdate/$VERSION/android/$datevar
mv temp/ios/bundle.zip HotUpdate/$VERSION/ios/$datevar
mv temp/android/bundle.zip HotUpdate/$VERSION/android/$datevar
cp temp/metadata.json HotUpdate/$VERSION
rm -rf temp
