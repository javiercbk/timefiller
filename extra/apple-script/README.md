# Setting this script with launchd

* Open `AppleScript Editor` and paste the contents of the `apple-script.txt`.
* Change `cd /path-to/timefiller-script` to the full path of this project's root folder.
* Save as application: File > Save. The file format must be `application`.
* Edit the `com.time.filler.plist` and change `<string>/PATH_TO_TIME_FILLER/timefiller.scptd</string>` for the full path of the recently saved script.
* Copy the `com.time.filler.plist` to `~/Library/LaunchAgents/com.time.filler.plist`
* Execute the following command.

```sh
launchctl load ~/Library/LaunchAgents/com.time.filler.plist
```

Nicely done! Now this script will execute when the machine starts or at 10 AM in the morning from monday to friday.

