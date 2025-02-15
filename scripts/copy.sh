#!/bin/zsh

datevar=$(date +'%Y%m%d')
mkdir -p HotUpdate/ios/$datevar
mkdir -p HotUpdate/android/$datevar
mv temp/ios/bundle.zip HotUpdate/ios/$datevar
mv temp/android/bundle.zip HotUpdate/android/$datevar
cp temp/metadata.json HotUpdate
rm -rf temp
