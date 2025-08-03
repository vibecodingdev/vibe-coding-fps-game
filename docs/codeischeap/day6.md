# Prompts

We will load experimental BSP maps, DOOM-style maps, and put them into a special experimental menu, communicating their unfinished status to the community. This will keep the main game content simple. (It may be possible to completely re-plan the main menu after entering the main interface, such as the manual entry now has many other functions, which may need to be adjusted.) @/client-ts

We plan to add some leaderboards for key game values, such as wave levels in single-player mode, total monster kills, player deaths, health pack pickups, ammo pack pickups, player kills, and the number of demons created using tools. Then, we will add this series of leaderboards to the @/website.

Add a leaderboard page in @website/. Then, in the relevant game logic, call the @website's related interface to report information. It is also necessary to determine and check the login status and identity. Currently, the website is deployed at www.tinyvideogame.com, and the game is at fps.tinyvideogame.com, so consider using cookies to pass the login status under the main domain. This is a task that affects many aspects, so please carefully plan the todo list and proceed step by step.
