# AlaireBot what does it do?
It does not much things right now, but it can kick people by giving them a role so they can be muted instead of kicked. Allowing mods to be able to moderate in 
a nicer way.

Below are some todo's. Feel free to step in and just add to the bot. 

# Using the Bot
- Pull the code
- npm install
- place a "discord.key" file in the Project root. Containing your Discord developer Key in Plaintext
- On First Run the Required Files/Folders are created.
- Restart and have fun

# Contribution
Sure, go into src/discord/commands and look how the structure is build and extend the functionality like you need it

Want to develope the online api/website? Look into src/server

# TODO
- ~~Mute should add to the muted Database~~
- Allow certain commands only in Bot Channels
- Allow certain commands only by certain roles
- Permissions
    - User wins always, if the user is denied, the role can't allow it
    - ~~Permission database~~
- Respond to certain commands only in a Bot Channel
    - Create and Save ID of Bot Channel in Config
- ~~Watcher for Muted User creating~~
    - ~~Watcher should run periodically (5s?)~~
    - ~~Check if Timestamp + duration is < now~~
        - ~~If it is, unmute i.e. remove role~~
        - If it is, then write into a Botchannel
- Get and set server port in main,json
- ~~Default Setup Vars in each command to setup them all at once for a new Server~~