# Welcome 👋

## Quick Links

<ol>
    <li><a href="#intro">Intro</a></li>
    <li><a href="#setting-up">Setting Up</a>
    <ol>
    <li><a href="#the-terminal">The Terminal</a></li>
    <li><a href="#installing-xcode">Installing Xcode</a></li>
    <li><a href="#installing-node-and-npm">Installing Node and NPM</a></li>
    <li><a href="#git">Installing Git</a></li>
    </ol>
    </li>
    <li><a href="#configuring-your-tests">Configuring Your Tests</a></li>
    <li><a href="#running-a-test">Running a 
    Test</a></li>
</ol>

## Intro

This script is designed to automate testing of Impressure flows. Using this script, we can input and submit real data into insurance flows, and log the integrations + responses to the console for viewing.

What makes this special This script is a set and forget automation. You simply run the script and within a few seconds the flow is stepped through and submitted - no more clicks and random data entry!

How does it work? The script is powered by Node.js and Puppeteer. Both tools run the javascript language and enable everything in the background. Don't worry, we don't need to understand these tools - or even this script - in order to use it!

IMPORTANT - for now - the following instructions assume that this will be run using a Mac OS device. If you are on windows, you will have to search for how to do each task on windows.

## Setting Up

<ol>
    <li>
        <h3 id="the-terminal">The Terminal
        </h3>
        Your computer's Terminal will be an integral part of using this tool. Basically, the Terminal is a program that lets you give your computer direct commands. Below will be a series of commands we can type (or paste) into our Terminal to get things set up.
        <br/>
    </li>

<li>
    <h3 id="installing-xcode">Installing Xcode</h3>

Xcode is a set of tools developed by Apple that enable us to do thingd from the Terminal (also referred to as the command line or CLI).

First, let's check that xcode command line tools aren't already installed. Open up your terminal and paste the following command in, then press enter:

```
xcode-select --version
```

This will check to see if a version is installed - if you get a response similar to

```
xcode-select version 2384
```

then you can skip to <a href="#installing-node-and-npm">step 3</a>.

If you see a response similar to

```
command not found
```

then you'll have to install. To install, run:

```
xcode-select --install
```

and follow the prompts. This installation will take awhile.

Once complete, run:

```
xcode-select --version
```

you should get the version back instead of an error.
<br/>

</li>

<li>
<h3 id="installing-node-and-npm">Installing Node and NPM</h3>

We've talked about Node.js, but NPM is still a stranger, right? NPM is just an extension for Node.js, that allows you to download certain tools, like Puppeteer, for example. Using NPM makes it really easy to run the script with minimal manual steps.

First, you'll need to <a href="https://nodejs.org/en/download/" target="_blank">install node.js</a> on your machine. Choose the macOS installer and follow the prompts.

Check your installation was done properly by pasting

```
node --version
```

into your terminal and hitting enter. Your terminal should return a version number.

Next, let's install npm, which will allow us to download Puppeteer. To install npm, simply run

```
npm install -g npm
```

if this doesn't work (you'll see an error message in your terminal), you may need to run

```
sudo npm install -g npm
```

You may be prompted for a password in your terminal. This is the password that logs you into your machine. You'll notice that when you are typing, it doesnt look like anything is entered into your Terminal, that's ok, just type your password normally and hit Enter. If typed correctly, Terminal will begin running your command.

Once complete, run

```
npm --v
```

or

```
npm --version
```

you should get an output of a version number, meaning NPM is installed properly.
<br/>

</li>

<li>
<h3 id="git">Installing Git</h3>

If you've made it this far, we're almost done! Last step is to grab the code from the repository so we can use the script. First, you'll need to choose a place in your computer where the files will be. Something like Documents/sites/ - or whatever you like. Once you have your folder created/chosen. Open up your Terminal.

You will need to know your folder path for this step. The easiest way to do this is to open a Finder window, click View > Show Path Bar. You'll notice the bottom area of your Finder window will now have the full path of your folder.

Right click the folder you want to target in the path bar, and select Copy as Pathname. In your terminal, paste the following.

**Note**: instead of Path/To/Your/Folder - you'll have to paste the path you copied from your path bar

```
cd Path/To/Your/Folder
```

Hit enter, now you'll see that Terminal is pointing to the folder you want. Your next step is to clone the repository that the code is in. Paste the following into your Temrinal and run it:

```
git clone https://github.com/vit-the-jedi/impressure.git
```

you'll see Terminal working some magic, and once it's done you should have the folders + files in the folder you chose.
<br/>

</li>

</ol>

## Configuring Your Tests

<br/>

<ol>
<li>
<h3 id="the-config-object">The Config Object</h3>
The script runs off of parameters we set in the
config object.

You can customize how the script runs by changing these parameters.

```
//config object for our script
const config = {
  link: "https://preview.impressure.io/cdjvks65-protect-com",
  mobile: "on",
  integrations: "on",
  targetIntegrations: ["Mastadon", "L&C"],
  noBrowser: true,
  fakePerson: {
    email: "puppeteerProtectTe@st.com",
    "first name": "Test",
    "last name": "Test",
    "street address": {
      street: "116 test street",
      city: "Beacon Falls",
      state: "CT",
      zipCode: "06672",
    },
    "primary phone": "2033333345",
  },
  typeDelay: 0,
  slowMo: 0,
};
```

<br/>

</li>

<li>
<h3 id="config-link">link</h3>
The value of the link parameter is the URL of the page you wish to test.

<strong>Note</strong>: The value you pass must always be in double or single quotes.
<br/>

</li>
<li>
<h3 id="config-mobile">mobile</h3>
changing the mobile parameter will toggle mobile on or off.

<strong>Note</strong>: The value you pass must always be in double or single quotes.
<br/>

```
...
mobile:"on", //will turn mobile on
mobile:"off", //will turn mobile off
...

```

<br/>

</li>
<li>
<h3 id="config-integrations">integrations</h3>
Changes the mobile parameter will toggle integrations on or off. <strong>The recommended value for this parameter is "on" - only change this if you're sure you don't want to submit + view a test lead.</strong>

<br/>

<strong>Note</strong>: The value you pass must always be in double or single quotes.

<strong>Note</strong>: If you turn integrations off, the script will close after the TCPA info is entered. It will not submit and move on to the offers page.
<br/>

```
...
integrations:"on", //will turn integrations on
integrations:"off", //will turn integrations off
...

```

<br/>

</li>
<li>
<h3 id="config-target-integrations">targetIntegrations</h3>
This parameter tells our script which integrations to watch for when we submit the lead. Add the names exactly as they appear in Impressure, for of each integration you want to watch for.

<strong>Note</strong>: The value you pass must always be an array, even if there is only 1 you want to watch for.
<br/>
<strong>Note</strong>: The script uses this array to also know when to close after the integrations are submitted. Currently, we watch for 2 \* the length of the array (1 log for the submitted data, and 1 log for the response for each integration.)
<br/>

```
...
targetIntegrations: ["Integration Name 1", "Integration Name 2","Integration Name 3", etc ],
...

```

<br/>

</li>

<li>
<h3 id="config-noBrowser">noBrowser</h3>
This parameter controls whether the script will open a browser or not. There are use cases for both opening a browser, and not.

The recommended setting for this parameter is <strong>true</strong>. This allows you to create a test + submit a lead within a few seconds - and get the integrations log in your Terminal. True is the default setting.

Opening a browser is only recommended when you want to watch the test unfold, step by step. It is recommended that if you are going to set noBrowser to true, that you also provide a <a href="#config-slowMo">slowMo</a> value to 500 or greater.

<br/>

<strong>Note</strong>: The value you pass must always be in double or single quotes.

<strong>Note</strong>: If you turn integrations off, the script will close after the TCPA info is entered. It will not submit and move on to the offers page.

</li>

<li>
<h3 id="config-fakePerson">fakePerson</h3>
The fakePerson object is the data personal information that will be inserted into the flow. You can change any of these values to your liking.
<br/>

</li>

<li>
<h3 id="config-typeDelay">typeDelay</h3>

Change this property to slow down the speed at which puppeteer types in values, in milliseconds.

</li>

<li>
<h3 id="config-slowMo">slowMo</h3>

Change this property to slow down the speed at which the script executes, in milliseconds. The higher the value, the longer the delay between each action.

It's only recommended to change this setting if you are also setting <a href="#config-noBrowser">noBrowser</a> to false.
<br/>
<br/>

</li>

## Running a Test

All that's left to do now, is target the folder in Terminal that contains the script you want to run, for example Path/To/Your/Folder/impressure/puppeteer/protect-flow

Once you've targeted it by running the following in your Terminal,

```
cd Path/To/Your/Folder/impressure/puppeteer/TargetFolder
```

paste and run the command below to ensure we have the most up-to-date version of the code:

```
git pull
```

Once that is complete, paste the following in your Terminal, and you'll see the script running and submitting a test lead! 🎉

```
node test.js
```

<br/>
