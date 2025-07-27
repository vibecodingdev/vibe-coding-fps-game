# Prompts

Now that we have different scene themes, can we also differentiate the models and skins of monsters in different themes, making the color and image consistent with the scene?

When clicking the "return to main menu" option in the pause menu during gameplay, the game freezes on the game interface and does not correctly return to the main interface.

Now we can correctly return to the main menu, but after returning to the main menu, the mouse will be in a locked state and requires pressing esc to continue operating the main interface. We hope that after returning to the main interface, the mouse will not be locked, and an error can be seen in the console: hook.js:608 THREE.PointerLockControls: Unable to use Pointer Lock API
overrideMethod @ hook.js:608 . Additionally, when in the game state, clicking esc will cancel mouse locking, but the pause menu will not appear, requiring another press of esc to appear pause menu, we hope that in the game, as long as the mouse is unlocked, the pause interface should be displayed.

Currently, the gun model is slightly smaller and mounted on the back. It can be optimized by referencing the size of the model held in front of the character model's body. Additionally, we hope to enable player-to-player damage in multiplayer mode, making the game more engaging. Then, on the interface after a player's death, add a countdown timer with a revivable button that can be clicked after 10 seconds, allowing the player to re-enter the game with full health and ammo (note that multiplayer mode also requires synchronized revival behavior).
