# Timefiller script

To install dependencies:
```sh
npm install
```

To run the script:

```sh
node index.js
```

## Features

Creates work logs in JIRA and Harvest.

## Requirements

You need Waka time installed in your IDE, waka time API KEY, and complete the `timefiller.json` file.

## Config

You must create a file (timefiller.json in the root directory by default) that MUST contain the waka time API KEY. There is an example file called `timefiller.example.json`, you can duplicate that file and input the right config.

JIRA's or Harvest's config are optional, you may not include that config and the script is going to work anyway.

## Caveats

The script does not support a "Cat in the keyboard", so do expect some funky errors if passwords are wrong and things like that.
