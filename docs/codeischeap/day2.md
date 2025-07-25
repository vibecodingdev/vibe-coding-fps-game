# Prompts

Please help me implement the current single-file @/client in the @/client-ts directory using typescript, and reasonably split the modules and configurations, so that the project is more convenient for long-term iteration, and it is also easier to discover and eliminate various low-level errors at the code level in advance through ts compile and testcase.

Now we have a typescript-based framework @/client-ts , but we haven't yet migrated all the features of the previous single-file js version. Now please gradually migrate its design to the new ts version. First, you can start with single-player mode (our short-term goal is to implement the ts version to the same progress as the current single-file version) @/client

Please continue to migrate the implementation of game scenes and monster-related features to further migrate the gameplay of the single-file version to the new ts version.

Currently in single-player mode, the position of the main character's camera seems to be incorrect, and when the view is rotated, the scene will sometimes turn completely blue. In addition, the main character cannot move at the moment. Please continue to migrate the logic of character movement and shooting related to @/client old version to the ts version, and fully migrate the UI in the battle scene to the new ts version.

The current radar UI position still has issues. Additionally, the problem of seeing the blue scene is still present, which seems to be a problem of penetrating the surrounding models when rotating the camera, please check and fix again.

Some issues from before are still not fixed, please check again carefully. Currently, the radar is still in the middle of the screen, the character still cannot move using the keyboard, and there is still a possibility of a full blue screen when rotating, and runtime errors will still occur when monsters attack: three.module.js:27371 Uncaught TypeError: Cannot read properties of undefined (reading 'value') at i (three.module.js:27371:22)

(Provided related UI screenshots) We have successfully fixed some functions, but the radar is currently not placed in the designated radar UI container in the top-right corner, but rather in the top-left corner, which needs to be repaired. The scene rotation no longer has the blue issue. However, the character's movement is still not normal, and clicking the keyboard does not successfully move. After pressing ESC to exit mouse lock and then clicking the screen again, it cannot return to the locked state. It is possible to consider porting the pause menu after pressing ESC from the old version to the TS version, and fix this problem at the same time.
