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
- Add Roles Via Reactions
    - ~~Configure which roles can be added with what reaction~~ 19.July.2020
    - ~~Remove roles from that configuration~~ 01.August.2020
    - ~~Add reactions to Message~~
    - ~~Have a Database for all Messages that can add permission~~
    - ~~Add Permission when reacted~~ 08.August.2020
    - ~~Remove when reaction is rewoked~~ 12.August.2020
- ~~Mute should add to the muted Database~~
- Allow certain commands only in Bot Channels
- ~~Allow certain commands only by certain roles~~
- Permissions
    - ~~User wins always, if the user is denied, the role can't allow it~~
    - ~~Permission database~~
    - ~~Set Permissions~~ 28.June.2020
    - ~~Check for Permissions~~ 28.June.2020
    - ~~Remove PermissionCommand~~ 09.July.2020
- Respond to certain commands only in a Bot Channel
    - Create and Save ID of Bot Channel in Config
- ~~Watcher for Muted User creating~~
    - ~~Watcher should run periodically (5s?)~~
    - ~~Check if Timestamp + duration is < now~~
        - ~~If it is, unmute i.e. remove role~~
        - If it is, then write into a Botchannel
- Get and set server port in main,json
- ~~Default Setup Vars in each command to setup them all at once for a new Server~~
- Use Default Emotes