# Prompts

The issue of referencing game states seems to have caused many small troubles. Can we unify the global management of all game states to avoid the problem of each managing different state references?

OK let's start the next step of porting work, please port the multiplayer-related modules from the old single-file version of @/client to the new @/client-ts version, and ensure that the server event implementation is fully consistent and can be compatible with the current server implementation, including server connections, UI related to room management, and the rendering of character models and monster position state synchronization after entering multiplayer mode, as well as voice interaction functions in multiplayer mode.

Currently, after p1 creates a multiplayer room and p2 joins, p1's interface cannot see the newly joined p2. Additionally, the custom names of p1 and p2 are not displayed correctly, showing random names starting with "demon". After both parties enter and click the ready button, there is no response, and they cannot switch to the ready state. This prevents the game from starting and proceeding to the next test step. Please refer to the old version of @/client for implementation, check the problems existing in the current ts version, and fix them.

Please attempt to add a demon configuration and design that can perform remote attacks, such as using fireballs for long-range attacks.

Currently, the monster wearing a flaming hat correctly launches a red fireball. However, when the fireball comes into contact with the player's camera range, it does not actually cause damage. Is the collision range too small? Additionally, can the fireball effect be enhanced after a direct hit, making it more noticeable? Furthermore, all monster attacks should, like the old version of @/client, cause a full-screen red effect, alerting the user that they have been attacked, making the injury experience more intuitive.

Please add a wall effect to the scene, you can refer to the implementation of @/client as appropriate to prevent players from leaving the core area. In addition, please match the scene with this border in various scene styles, add appropriate obstacle expressions, and make this wall effect more natural.

Is there a way to prevent the visual penetration effect when the camera approaches the wall? Can we solve this problem by making the wall model slightly larger than the actual intercept action area?

Can we add a few light sources to the scene to make it slightly brighter, as it currently fits the dark style but tends to cause visual fatigue?

The flickering of the ground texture is quite severe, is it due to the camera being too close to the ground? Additionally, the phenomenon of monsters penetrating the ground is also quite severe, and it should be the monster's feet that touch the ground, not the center point of the body.
