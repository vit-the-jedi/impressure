#Welcome 👋

##Intro

This script is designed to automate testing of Impressure flows. Using this script, we can input and submit real data into insurance flows, and log the integrations + responses to the console for viewing.

What makes this special This script is a set and forget automation. You simply run the script and within a few seconds the flow is stepped through and submitted - no more clicks and random data entry!

How does it work? The script is powered by Node.js and Puppeteer. Both tools run the javascript language and enable everything in the background. Don't worry, we don't need to understand these tools - or even this script - in order to use it!

IMPORTANT - for now - the following instructions assume that this will be run using a Mac OS device. If you are on windows, you will have to search for how to do each task on windows.

##Setting Up

###1. The Terminal

Your computer's Terminal will be an integral part of using this tool. Basically, the Terminal is a program that lets you give your computer direct commands. Below will be a series of commands we can type (or paste) into our Terminal to get things set up.

###2. Installing Xcode

Xcode is a set of tools developed by Apple that enable us to do thingd from the Terminal (also referred to as the command line or CLI).

First, let's check that xcode command line tools aren't already installed. Open up your terminal and paste the following command in:

```
xcode-select --version
```

This will check to see if a version is installed - if you get a response similar to ```
xcode-select version 2384

```
then you can skip this step.

If you see a command similar to
```

command not found

```
then you'll have to install. To install, run
```

xcode-select --install

```
and follow the prompts. This installation will take awhile.

Once complete, run
```

xcode-select --version

```
 again and you should get the version back instead of an error.


```

###3. Installing Node.js and NPM

We've talked about Node.js, but NPM is still a stranger, right? NPM is just an extension for Node.js, that allows you to download certain tools, like Puppeteer, for example. Using NPM makes it really easy to run the script with minimal manual steps.

To install, simply run

```
npm install -g npm

```

if this doesn't work (you'll see an error message in your terminal), you may need to run

```
sudo npm install -g npm
```

Once complete, run

```
npm -v
```

or

```
npm -version
```

you should get an output of a version number, meaning NPM is installed properly.

###4. Git

If you've made it this far, we're almost done! Last step is to grab the code from the repository so we can use the script. First, you'll need to choose a place in your computer where the files will be. Something like Documents/sites/ - or whatever you like. Once you have your folder created/chosen. Open up your Terminal.

You will need to know your file path for this step. The easiest way to do this is to open a Finder window, click View > Show Path Bar. Youu'll notice the bottom area of your Finder window will now have the full path of your folder.

Right click the folder you want to target in the path bar, and select Copy as Pathname. In your terminal, paste

```
cd /Users/mattvitello/Documents/sites

instead of /Users/mattvitello/Documents/sites - you'll have to paste the path you copied from your path bar
```

hit enter, now you'll see that Terminal is pointing to the folder you want. Your next step is to clone the repository that the code is in. Paste the following into your Temrinal and run it:

```
git clone https://github.com/vit-the-jedi/impressure.git
```

you'll see Terminal working some magic, and once it's done you should have the folders + files in the folder you chose.

###5. Final Step!
All that's left to do now, is target the folder in Terminal that contains the script you want to run, for example /Users/mattvitello/Documents/sites/impressure/puppeteer/protect-flow

Once you've targeted it, paste and run the following into your terminal, and you'll see the script running in the background and submitting a test lead!

```
node test.js
```
