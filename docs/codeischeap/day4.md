# Prompts

🍵
Now that we have different scene themes, can we also differentiate the models and skins of monsters in different themes, making the color and image consistent with the scene?

🚽
When clicking the "return to main menu" option in the pause menu during gameplay, the game freezes on the game interface and does not correctly return to the main interface.

🥤
Now we can correctly return to the main menu, but after returning to the main menu, the mouse will be in a locked state and requires pressing esc to continue operating the main interface. We hope that after returning to the main interface, the mouse will not be locked, and an error can be seen in the console: hook.js:608 THREE.PointerLockControls: Unable to use Pointer Lock API
overrideMethod @ hook.js:608 . Additionally, when in the game state, clicking esc will cancel mouse locking, but the pause menu will not appear, requiring another press of esc to appear pause menu, we hope that in the game, as long as the mouse is unlocked, the pause interface should be displayed.

🧋
Currently, the gun model is slightly smaller and mounted on the back. It can be optimized by referencing the size of the model held in front of the character model's body. Additionally, we hope to enable player-to-player damage in multiplayer mode, making the game more engaging. Then, on the interface after a player's death, add a countdown timer with a revivable button that can be clicked after 10 seconds, allowing the player to re-enter the game with full health and ammo (note that multiplayer mode also requires synchronized revival behavior).

☕️
We hope that the game's code structure can easily add new demon models, please add a few new demons similar to the ones in the screenshot to test whether it is relatively easy to add new demons, and if necessary, optimize the current demon configuration and implementation code structure to facilitate the addition of new demons at any time.

🥣
After dying in single-player mode, the mouse does not automatically unlock and remains in a locked state, requiring a press of the esc key to unlock. Additionally, the countdown timer does not function correctly, always displaying 5 seconds, making it impossible to revive, and clicking the "quit to menu" button is also ineffective.

🍵
Currently, demons often pass through the ground model and fly in the air. Please adjust their movement strategy to keep them moving on the ground as much as possible, with only moderate height changes. Additionally, the camera height of the main character should be around head height, not waist height. Furthermore, in multiplayer mode, the coordinates being transmitted should be the current camera coordinates, but when rendering other players, it's possible that the coordinates are the footstep points, resulting in players appearing to float. These issues need to be fixed simultaneously.

🎹
To enhance the diversity of character models in multiplayer mode, we should consider adding more character models that can be easily integrated into the game in the future. Inspired by images, we can design more player character models with varied details and color schemes while maintaining a human-like structure. Additionally, to facilitate testing, we can add preview interfaces for character models, weapons, monsters, and scenes in the main menu's help section, allowing us to preview all the basic models and scenes available after entering the menu.
