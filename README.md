# NetherGames Stats Overlay

Stat checks everyone in your game/match in NetherGames.  
This application was made with electron.

## Compatibility

**Windows 10 or 11** with Minecraft installed  
We support **all minecraft versions** NetherGames supports.  
We support **all minecraft architectures** (x64, x86 & arm)

## Requirements

This application requires you to have [Node.js](https://nodejs.org/en/) installed. You also need to run the following command **with PowerShell** in order to exempt loopbacks for Minecraft.

`CheckNetIsolation LoopbackExempt -a -n="Microsoft.MinecraftUWP_8wekyb3d8bbwe"`

## Setup

### Build yourself

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
If you are having problems while using the app, feel free to join our [discord server](https://discord.gg/6t3cYEJN2X) and report the problem there.

## Contributors

**Kappug** - Founder  
**Melvin** - Cofounder  
**AdminRAT** - Threat/Smurf function
