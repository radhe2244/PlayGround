# PlayGround

<!-- omgithub:readme:start -->
## 🚀 Build, play, and remix with OMGithub

**Created using [OMGithub.com](https://go.ondev.store/).**

[![OMGithub](https://img.shields.io/badge/OMGithub-Open%20project-orange?style=for-the-badge)](https://go.ondev.store/radhe2244/PlayGround)
[![GitHub](https://img.shields.io/badge/GitHub-Source-181717?logo=github&style=for-the-badge)](https://github.com/radhe2244/PlayGround)

- 🎮 [Open the project](https://go.ondev.store/radhe2244/PlayGround).
- ✨ [Remix this project](https://go.ondev.store/radhe2244/PlayGround?remix=1).
- 💻 [Explore the source](https://github.com/radhe2244/PlayGround).
- 🛠️ [Check build runs](https://github.com/radhe2244/PlayGround/actions).
- 🐛 [Report an issue](https://github.com/radhe2244/PlayGround/issues).
- 👤 [Explore the creator's projects](https://go.ondev.store/radhe2244).
- 🌍 [Create with OMGithub](https://go.ondev.store/).
<!-- omgithub:readme:end -->

## Play the browser game

1. Install [Node.js](https://nodejs.org/) or Python 3.
2. In this folder, run `./start.sh` if the OMGithub runtime is available. For a plain local setup, run `python3 -m http.server 8000`.
3. Open the URL printed by the server (usually <http://localhost:8000>) in a browser.
4. Use **Next day** to run the studio and **Work on project** to focus a day on development. The game saves automatically in this browser using local storage.

The browser version is a self-contained HTML/CSS/JavaScript game and needs no install or build step. To start over, clear this site's local storage in your browser's developer tools.

## Run the Unity prototype

The Unity version is a dependency-free C# prototype, not a preconfigured Unity project. It uses IMGUI and PlayerPrefs, so no prefabs or extra packages are required.

1. Install **Unity 6** with Unity Hub and create a **Universal 3D (URP)** project.
2. Copy `Assets/Scripts/GameStudioTycoon.cs` into the matching `Assets/Scripts/` folder in that project.
3. Open a scene, create an empty GameObject named `Game Studio Tycoon`, and add the `GameStudioTycoon` component.
4. Press **Play**. Use the on-screen tabs and buttons; progress is saved locally through PlayerPrefs.

To reset the Unity save, use the prototype's in-game reset control or clear the `IndieEmpire.Save.v1` PlayerPrefs key. The Unity prototype has not been compiled or run in this environment because a Unity installation/project is not present.
