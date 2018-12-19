EP = electron-packager ./build/electron-app --ignore=node_modules/electron-packager --icon=manifest/backend-ai.icns --ignore=.git --overwrite --ignore="\.git(ignore|modules)" --out=app

mkfile_path := $(abspath $(lastword $(MAKEFILE_LIST)))
current_dir := $(notdir $(patsubst %/,%,$(dir $(mkfile_path))))


mac:
	polymer build
	mkdir build/electron-app
	cp -Rp build/es6-unbundled build/electron-app/app
	cp -Rp ./wsproxy build/electron-app/wsproxy
	rm -rf build/electron-app/wsproxy/node_modules
	cp ./wsproxy/package.json build/electron-app/package.json
	cd build/electron-app; npm install
	cp ./main.electron-packager.js ./build/electron-app/main.js
	$(EP) --platform=darwin
	$(EP) --platform=win32
clean:
	cd app;	rm -rf ./backend*
	cd build;rm -rf ./es6-unbundled ./electron-app
