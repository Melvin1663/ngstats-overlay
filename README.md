# NetherGames Stats Overlay

Stat checks everyone in your game/match in NetherGames.  
This application was made with electron.

## Compatibility

**Windows 10 or 11** with Minecraft installed  
We support **all minecraft versions** NetherGames supports.  
We support **all minecraft architectures** (x64, x86 & arm)

## Requirements

This application requires you to have [Node.js](https://nodejs.org/en/) (LTS) installed. You also need to run the following command **with PowerShell** in order to exempt loopbacks for Minecraft.

```
CheckNetIsolation LoopbackExempt -a -n="Microsoft.MinecraftUWP_8wekyb3d8bbwe"
```

## How to install

**Video Tutorial: [Here](https://dl.dropboxusercontent.com/s/hbc8wzqvgispr1n/ngstats-overlay%20tutorial.mp4)**
1. Download the setup file from the **latest release** found on this github page.
2. After downloading the setup file, run it. If your antivirus flags the file as malicious/harmful, allow it/ignore the threat. 
3. Upon running the setup file, a small animation will appear on your screen. Wait for it to disappear.
4. When it disappears, The NetherGames Stats Overlay window should appear on your screen. You just installed it!

## How to update
Simply run the setup file for the new version, it is not required to uninstall your current version of the app, it will still work the same.

## FAQ

**Q:** App shows "Proxy server closed unexpectedly."  
**A:** Check if you have NodeJS installed by running node -v in powershell. If it returns a version number, it is installed, if it says it's not a command then it's not installed, please install it from https://nodejs.org/ If it is already installed and still saying "Proxy server closed unexpectedly." please post the logs (`%appdata%/NetherGames Stats Overlay/logs` latest log file) in #help in the discord server.
  
**Q:** Does this work for mobile?  
**A:** No, and we do not have any plans on having support for mobile.  
  
**Q:** What is threat/smurf?  
**A:** It is a percent value which tells you how likely the player is an alternate account by an experienced player.

## Setup

**If you want to compile the project yourself**

Install packages

```
npm i
```

Compile

```
npm run make
```

## How it works

This application utilizes the module [`bedrock-protocol`](https://www.npmjs.com/package/bedrock-protocol) for creating a proxy server where the application is able to observe packets that are sent from the NetherGames server. This is required in order to get the player list from the game. (No need to inject a DLL)  

![screenshot](https://i.imgur.com/fK6vWKb.png "Preview")

## Having Problems

This application is far from perfect so you may encounter some bugs here and there...
If you are having problems while using the app, feel free to join our [discord server](https://discord.gg/PadKthDx8g) and report the problem there.

## Contributors

**Kappug** - Founder  
**Melvin** - Cofounder  
**AdminRAT** - Threat/Smurf function
