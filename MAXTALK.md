# MaxTalk 0.3

A Game Boy Color-inspired pocket companion for Max and Ellis. This supersedes the tap-to-capture CatTalk 0.2 interface.

Press A / START once for continuous foreground listening. It groups sound events with a short silence boundary or a three-second maximum; it does not disconnect between quiet windows. Press B / STOP to release the microphone and stop all speech. It also stops when hidden or locked.

On the first detection of each sound type, listening pauses and asks what to do. Ignore hides the response options and suppresses future actions. Respond offers contextual English, a cat voice, a written message, or a spoken message. Choices persist per device and can be edited in Sound Setup. Unrecognized sounds share one rule; this is not an open-ended sound-identification model.

Meow, purr, hiss and double clap use experimental heuristics. Teach the actual Mac startup and speaker on/off audio in Sound Setup first. Detected events have a four-second cooldown. The microphone is released during replies and resumes after a 500 ms tail. Rules and recognition remain separate: teaching a sound does not silently pick its response.

All ten original cat-message intents remain. Cat mouth motion follows output audio energy; English mouth motion follows speech timing and word boundaries, not phoneme-level visemes. English uses an installed local voice when available and always retains visible text.

Offline setup now checks the complete cached asset list through the service worker. If an update fails while a valid cached copy exists, the app retains an offline-ready status; missing storage gets an explicit retry button. A stopped local server was the observed cause of the reported setup error. Browser verification confirmed reload and generated playback with the local server stopped. This does not establish iOS-specific offline compatibility.

Run npm test for acoustic-core and continuous-listening lifecycle tests. Run npm start for a local preview. app/ contains the runtime; dist/ is the exact static hosting copy. Hosting is private to the owner unless explicitly changed, so first access remotely may require signing in online. Keep the Home Screen copy loaded before testing Airplane Mode. No microphone audio is uploaded.

No original /mnt/data files were accessible: this is reconstructed from the prior conversation. Older-iOS, microphone accuracy and real-room trigger acceptance testing remain necessary. See README.md for the original platform assessment and source references; its v0.2 interface descriptions are historical.
