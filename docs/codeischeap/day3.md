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

We now have a dark red scene, and when creating a multiplayer room, we can choose different scene styles. Now we want to randomly enter these different scene styles in single-player mode as well. Please try to adjust the color direction of the other styles towards the three screenshot directions provided, with one scene leaning towards dark blue, one towards dark green, and one towards gray-white. This way, we can have four visually distinct scene styles. Additionally, the current scene management file has a lot of code. Please use an appropriate way to organize the implementation of multiple scenes, avoiding the problem of a single code file being too large.

In the current network mode, the spawned monsters are all cubes, unlike the diverse demons designed in single-player mode. Please check the related logic and fix this issue. Additionally, these cubes seem to be indestructible, and each client in network mode still refreshes unrelated local demons, without synchronizing their positions.

We have now seen the creation of network-synchronized demons in multiplayer mode, but they still haven't moved, and their positions are not displayed in the top-right radar, nor are the positions of other players correctly displayed. Then, after killing a demon, the kill UI count increases by 1, but the demon does not disappear.

Before the CSS styles of the main interface are loaded, we will see a white, unstyled page flash by, and then the correct styles are applied. This user experience is not very good, and it needs to be elegantly and aesthetically corrected.

In multiplayer mode, the radar position display of monsters has been normalized, but after p1 kills a monster, the monster disappears from p1's radar, the monster model undergoes a death transformation (the model shrinks and stops moving) but does not disappear. However, the monster on p2's screen has not been synchronized to be cleared, and it also does not disappear from the radar. Please refer to the event handling related to synchronization in the old version of @/client to check if there are any events that have not been correctly synchronized or if the event key is incorrect.

Let's optimize the multiplayer mode. Assuming the game is entered using localhost, it will automatically attempt to connect to the server at localhost:3000 without requiring the user to click connect. After connecting to the server, it will automatically refresh the room list once, avoiding the need to click refresh. Then, at the username and roomname positions, a random name will be displayed by default each time the interface is entered, avoiding the need for manual input. The default number of players for creating a room should be set to 2 (currently default is 4).

In multiplayer mode, after p1 kills demons, they can correctly see the demons disappear on their own computer. However, on p2's computer, the demons' death and disappearance are not synchronized, including the model and mini-map. Additionally, p1 and p2 cannot see each other's dots on the mini-map (radar), currently only demons are visible, and there is no synchronization of demons' states. Please refer to the old version of @/client for implementation, and check some of its synchronization handling methods.
