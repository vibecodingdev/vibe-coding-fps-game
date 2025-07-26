# Prompts

The issue of referencing game states seems to have caused many small troubles. Can we unify the global management of all game states to avoid the problem of each managing different state references?

OK let's start the next step of porting work, please port the multiplayer-related modules from the old single-file version of @/client to the new @/client-ts version, and ensure that the server event implementation is fully consistent and can be compatible with the current server implementation, including server connections, UI related to room management, and the rendering of character models and monster position state synchronization after entering multiplayer mode, as well as voice interaction functions in multiplayer mode.
