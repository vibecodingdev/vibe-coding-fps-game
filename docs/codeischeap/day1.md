# prompts

## multiplayer

Implement SocketIO room service

## voice

In FPS games, typing is not easy due to the fast-paced game and mouse lock. Can we use the design similar to CS games, and send information by recording after pressing a certain keyboard? The recording can be converted into text through the browser's audio-to-text interface and sent out. If possible, you can also consider sending the audio directly to other players through socketio.

Currently, when you press the ESC key during the game, you will be directly returned to the main interface and cannot return to the game. In this way, you cannot recover from the game if you make a mistake. In addition, the chat box is currently blocked by the voice collection box, so you cannot see the result of voice conversion to text.

During FPS games, there should not be an overly complex UI, because the user's mouse is locked and the keyboard is used to control game operations. Therefore, please display the voice-related UI on the pause interface of the game process, and do not display it during the game. During the game, if the mouse is out of lock or the esc key is pressed, a pause interface should be entered, which can perform some game setting operations (such as the current voice-related) and a button is needed to return to the game, or exit the game and return to the main interface.

Upon resuming the battle, the paused menu remains visible, despite the mouse being locked and camera control being enabled. Furthermore, it is evident that the recorded voice has been successfully converted to text and transmitted via Socket.IO: 42["voice:message",{"playerId":"KXv3fRHTiBO8YGdhAAAT","playerName":"Ryan2","type":"speech-to-text","message":"play hello hello","timestamp":"2025-07-24T14:52:54.518Z"}]. However, the text does not appear in the chat box UI.
