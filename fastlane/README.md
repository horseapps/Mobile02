fastlane documentation
================
# Installation

Make sure you have the latest version of the Xcode command line tools installed:

```
xcode-select --install
```

Install _fastlane_ using
```
[sudo] gem install fastlane -NV
```
or alternatively using `brew cask install fastlane`

# Available Actions
## iOS
### ios match_development
```
fastlane ios match_development
```
Create development certificates
### ios match_appstore
```
fastlane ios match_appstore
```
Create app store certificates
### ios newapp
```
fastlane ios newapp
```
Create app in iTunes
### ios push
```
fastlane ios push
```
Creates a new push certificate, ready to be uploaded to SnapCore
### ios xcode
```
fastlane ios xcode
```
Installs FixCode which disables the "Fix Issue" button in Xcode
### ios beta
```
fastlane ios beta
```
Submit a new Beta Build to Apple TestFlight
### ios register_new_device
```
fastlane ios register_new_device
```

### ios refresh_profiles
```
fastlane ios refresh_profiles
```

### ios appstore
```
fastlane ios appstore
```
Deploy a new version to the App Store

----

## Android
### android keystore
```
fastlane android keystore
```
Creates an Android keystore
### android release_build
```
fastlane android release_build
```
Creates an Android ARM release build
### android release_build_x86
```
fastlane android release_build_x86
```
Creates an Android x86 release build

----

This README.md is auto-generated and will be re-generated every time [fastlane](https://fastlane.tools) is run.
More information about fastlane can be found on [fastlane.tools](https://fastlane.tools).
The documentation of fastlane can be found on [docs.fastlane.tools](https://docs.fastlane.tools).
