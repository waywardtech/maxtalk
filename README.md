# CatTalk 0.2 — iPhone / iPad prototype

Recommendation: a standalone, foreground PWA. This preserves the documented CatTalk 0.1 toy loop without requiring an App Store account or a Mac. Target iOS/iPadOS 13.4 or newer provisionally; prefer the latest OS supported by the device. Actual models and OS versions have not been supplied, and no Apple hardware has been tested.

## Provenance

Reconstructed from the accessible “Raspberry Pi Sound Projects” conversation, especially its specification summary and v0.1 build description. The referenced `/mnt/data` directory and original specification/ZIP were not available in this Windows workspace; the project mirror contained only AGENTS.md and reported five unsynced sources. This is not a line-by-line port or a verified match to those missing files. Reconcile the original files when available. Raspberry Pi work and synced sources have not been changed.

## Web versus native assessment

| Requirement | Web/PWA implementation | Native alternative / decision |
|---|---|---|
| Microphone | Safari getUserMedia, HTTPS, explicit permission; tap to listen | AVAudioEngine input tap with microphone permission |
| Audio playback and generation | Web Audio synthesizes every performance locally after a tap | AVAudioEngine / AVAudioPlayerNode |
| Simple recognition | Lightweight spectral energy, tonality and zero-crossing heuristics; no cloud | Same DSP, potentially better lifecycle control |
| Fixed triggers | Four named, locally trained spectral templates; foreground watch loop | Same matching engine; background audio session possible |
| Offline | Service worker caches every runtime file; local settings and fingerprints; no CDN or API dependencies | Bundled resources provide stronger installation durability |
| English voice | On-screen text is authoritative; optional local English speechSynthesis voice only | AVSpeechSynthesizer; installed voice still matters |
| Older iOS | Safari capture began in iOS 11; service workers in iOS 11.3; historical Home Screen capture failures make early versions poor targets | Native may help with a specific older model, subject to available SDK, deployment target and signing |
| Installation | Safari Share → Add to Home Screen; first online load required | Signed development/ad hoc/TestFlight/App Store distribution |
| Screen lock/background | Deliberately stops microphone and playback when hidden; tap to restart | AVAudioSession record/playAndRecord plus appropriate background mode; interruptions still require handling |

Do not build native solely for this tap-operated toy. Revisit native if the exact devices cannot run a usable Safari version, background listening becomes required, or permanent bundled offline delivery is essential. A thin WKWebView wrapper alone does not resolve old WebKit restrictions. Native build/sign/install needs macOS + Xcode and an appropriate signing/distribution route; this Windows environment cannot validate that deliverable.

## What is implemented

- Cat → Human: three-second microphone capture, experimental MEOW/PURR/HISS/OTHER guesses, breakfast/dinner/bedtime windows, and repeated-meow escalation within 20 seconds.
- Human → Cat: all ten documented intents, generated locally with varied pitch, timing, gaps, harmonic calls, purring and hiss. Intents use a selector, not speech recognition. No claim of genuine cat translation.
- Sound triggers: teach Mac startup, speaker on, speaker off and double clap. Fixed actions show a phrase and play the mapped cat performance. Speaker on/off means recognizing its audible sound, not Bluetooth connection monitoring.
- Half-duplex interaction: microphone tracks released before generated playback; 500 ms tail before watch resumes. Stop and hiding the page cancel pending work.
- Local routine and fingerprint persistence, input validation, permission-error messages, silence rejection, ambiguity rejection, and a microphone-free demonstration panel.

## Run and deliver

1. Install/use Node.js, then run `npm start` in this directory. No dependency install is needed. Local preview: http://localhost:8765 . This address is for this computer only.
2. Publish the contents of `app/` together at an HTTPS static host, preserving filenames and paths. No backend, build step, secrets, or account integration is required. Serve `.js` as JavaScript and `.webmanifest` as `application/manifest+json`. Serve `sw.js` with revalidation/no-cache. Do not use a host that requires a network login on every launch.
3. On the Apple device, open the HTTPS address in Safari, add to Home Screen, then launch the icon online and wait for “Ready offline.” Allow microphone access on the first Listen tap. Test again in Airplane Mode.
4. If Home Screen microphone access fails, try Safari at the same HTTPS address. Safari and standalone local data may differ on old versions; teach sounds in the context you will use.

No public deployment or signed iOS app was created. Opening index.html as a file, or visiting a computer’s ordinary HTTP LAN address from an iPhone, will not provide the required secure microphone/service-worker environment.

For updates, change the cache version in sw.js. The new worker waits until old app windows close; close all CatTalk windows and relaunch online. Browser storage can be evicted or cleared, so offline availability and taught fingerprints are not permanent backups.

## Calibration and limits

Teach a sound in a quiet room, immediately after pressing Teach. Keep distance and volume similar during playback tests. Quiet captures are rejected. The fingerprint compares 16 frequency bands; it is intentionally a small demonstration engine and can confuse acoustically similar sounds. Double clap additionally requires exactly two short pulses separated by 100–650 ms; a single clap is rejected. Room echoes and coarse 50 ms sampling can still cause missed or false detections. Do not rely on it for dependable wake detection. Real cat recognition and real trigger accuracy have not been measured. Train several real examples and evaluate false positives before calling this reliable. No machine learning model, MeowTalk integration, free-form speech-to-intent, or raw-audio recording storage is included.

## Verification

Run `npm test`: core tests cover routine windows (including midnight), repeated meows, silence, heuristic branches, trigger match/rejection/ambiguity, and all ten sound generators for bounded finite non-silent output and variation. These tests do not establish recognition accuracy.

Device acceptance checks still required: both Safari and Home Screen; portrait and landscape; permission allow/deny; cat capture; all ten voices; each taught sound repeated ten times plus unrelated noises; self-trigger suppression; Stop during permission/capture/playback; lock/unlock; interruptions; cold Airplane Mode launch; routine persistence after relaunch; no network traffic during use. Check installed local English voice separately. Keep volume gentle around the cat.

## Sources checked 2026-09-13

- WebKit: [A Closer Look Into WebRTC](https://webkit.org/blog/7763/a-closer-look-into-webrtc/) — Safari 11 capture and HTTPS requirement.
- WebKit: [New WebKit Features in Safari 11.1](https://webkit.org/blog/8216/new-webkit-features-in-safari-11-1/) — iOS 11.3 Service Worker and Cache API.
- WebKit: [Home Screen getUserMedia bug history](https://bugs.webkit.org/show_bug.cgi?id=180551) — historical standalone capture problems; API availability is not device acceptance evidence.
- Apple: [Configuring Web Applications](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html) — Home Screen standalone configuration.
- Apple: [Audio media user gesture](https://developer.apple.com/documentation/webkit/wkaudiovisualmediatypes/all) — audio playback gesture restriction.
- Apple: [AVAudioSession record category](https://developer.apple.com/documentation/avfaudio/avaudiosession/category-swift.struct/record) — native background recording configuration and interruptions.

The 13.4 target is an engineering starting point, not a verified universal compatibility guarantee. CSS uses a system font and no external assets; JavaScript avoids AudioWorklet, MediaRecorder and speech-recognition dependencies for older-device compatibility.

