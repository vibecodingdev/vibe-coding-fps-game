# Issues

1 When any player exits in multiplayer mode, the game Room is closed, and all players will pop up the room UI. This should only happen when the creator exits. Other players exiting should not cause the room to close.
2 In multiplayer mode, when a player dies and revives, there is a chance that they cannot see other players, possibly because the player list data is not synchronized after revival.
3 When clicking very quickly, it is possible to create two rooms with the same name, which should be avoided. This problem can be simply solved by not allowing rooms with the same name on the server.
