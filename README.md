# Michael Fitness

A workout logger that runs entirely in the browser. No server, no session to
lose. Every set is written to the phone's local storage the moment you log it,
so you can lock the screen, switch to Polar, take a twenty minute rest and come
back to exactly where you were.

Currently loaded: Joe DeFranco's Lean Bastard (9 weeks, 3 phases, workouts
A/B/C), the six Lean Bastard Standards tests, and the 30 Days of Delts booster.

## The files

```
michael-fitness/
├── michael-fitness.Rproj   open this in RStudio
├── index.html              the whole app: markup, styles, logic, programme data
├── manifest.json           lets it install to the home screen
├── sw.js                   offline caching (see "Updating" below)
├── sync.gs                 Google Apps Script, for the optional Sheet backup
├── robots.txt              keeps it out of search results
├── serve.R                 local preview, including on your phone over wifi
├── icons/                  home screen icons
└── README.md
```

`index.html` is the app. The other files are scaffolding.

## Running it locally

Open `michael-fitness.Rproj` in RStudio, then either:

- Open `index.html` and click **Preview** in the editor toolbar. Quickest, but
  desktop only.
- Open `serve.R` and click **Source**. This starts a local server and prints an
  address you can type into your phone on the same wifi. Needs `servr`:
  `install.packages("servr")`.

RStudio has no JavaScript debugger, so for anything beyond a typo use the
browser dev tools. On desktop Chrome that is F12. To debug the actual phone,
plug it into your Mac and use Safari's Develop menu.

## Putting it online

1. Create a repo on GitHub. The repo can be private; the published site will
   still be public, which is why `robots.txt` is here.
2. Push the contents of this folder to the repo root.
3. Settings → Pages → deploy from branch `main`, folder `/ (root)`.
4. Open the resulting URL on your phone in Safari, then Share → Add to Home
   Screen.

Run it from the home screen icon rather than a Safari tab. Standalone mode is
what stops iOS discarding it when you switch apps.

## Updating

**Bump `CACHE` in `sw.js` every time you change `index.html`.** It is currently
`mf-v2`; make it `mf-v3`, and so on. If you skip this, your phone will keep
serving the cached old version and you will wonder why nothing changed. There
are two cache layers fighting you here: the service worker and GitHub's own
ten minute asset cache, so give it a few minutes after pushing.

## Adding another programme

Open `index.html` and find the `PROGRAMMES` object near the top of the script
block. Copy the shape of `lean_bastard`:

```js
my_programme: {
  id:'my_programme', name:'Name', by:'Author', weeks:8, order:['A','B'],
  phases:[
    { n:1, label:'Phase 1', from:1, to:4, warmup:[...], workouts:{ A:[...], B:[...] } }
  ]
}
```

A workout is an array of blocks. A block is one screen:

```js
{ t:'Superset 1', rest:'30 sec between exercises', restSec:90, ex:[ ... ] }
```

`restSec` drives the rest countdown that fires when you tap Next.

An exercise:

```js
{ c:'1a', n:'Exercise name', v:'youtubeVideoId',
  note:'Coaching cue.',
  alt:{ n:'Alternative', v:'youtubeVideoId' },
  sets:[ { l:'Set 1', t:'8-10 reps (RIR 1-2)', k:'wr' } ] }
```

`k` decides how a set is logged:

| `k`     | What you get                                    |
|---------|-------------------------------------------------|
| `wr`    | weight and reps                                 |
| `reps`  | reps only                                       |
| `time`  | a stopwatch, with your previous best above it   |
| `check` | a single Confirm completed button               |

Anywhere in a `t` or `note` string, `{bw:25}` renders as the actual load for
25% of the bodyweight set in Settings. So `'Hold {bw:25}'` shows `Hold 22.5 kg`.

Then pick the new programme in Settings. Nothing else needs changing.

## Backing up to a Google Sheet

Optional, and the app works fine without it. Once set up, finished sessions
copy themselves to a Sheet in the background with nothing to press.

**One-time setup, about fifteen minutes.**

1. Create a new Google Sheet. Name it whatever you like.
2. Extensions > Apps Script. Delete the sample code in `Code.gs`.
3. Paste in the whole of `sync.gs` from this folder. Save.
4. Deploy > New deployment. Click the gear next to "Select type" and choose
   **Web app**.
5. Set **Execute as: Me** and **Who has access: Anyone**. Both matter. If
   access is left as "Only myself", Google sends back a login page instead of
   an error and the app cannot tell the difference, so it fails silently.
6. Click Deploy. Google will warn that the app is not verified. Click Advanced,
   then "Go to (project name) (unsafe)". This is your own script; the warning
   is because it has not been through Google's review process.
7. Copy the **Web app URL**. It ends in `/exec`.
8. In the app: Settings > Google Sheet backup, paste the URL in. The status
   line underneath should change to "All sessions backed up".

**Checking it works.** Finish a session, then look at the Sheet. You should see
a `log` tab with one row per set. If nothing appears, open the app in desktop
Chrome, press F12, and look at the Console for the reason.

**If you ever edit `sync.gs`**, use Deploy > **Manage deployments**, click the
pencil on the deployment you already have, and set Version to "New version".
Do not create a new deployment: that issues a new URL and the app carries on
posting to the old one.

**On a new phone.** Install the app, paste the same URL into Settings, then tap
**Restore from Sheet**. It pulls the whole history back and rebuilds your
personal bests. Running Restore twice is safe; it skips anything already there.

**No signal in the gym.** The session saves locally as always and joins a queue.
Next time you open the app with a connection, the queue empties on its own.
Settings tells you how many are waiting.

**A note on security.** The Sheet URL sits in `index.html`, so anyone with your
site URL could in principle post junk rows. For an unlisted personal app this
is not worth worrying about. If you want a small extra hurdle, set `TOKEN` to a
word of your choosing at the top of `sync.gs`, redeploy, and put the same word
in the app's token field.

## Your data

Everything lives in `localStorage` on the one phone. It is never sent anywhere,
and it is not synced between devices. Two consequences worth knowing:

- Clearing Safari's website data wipes it.
- Export CSV from History gives you a copy any time. If you have the Sheet
  sync switched on, that is the better backup, and `googlesheets4` will read
  it straight into R.
- Run the app from the home screen icon, not a Safari tab. iOS clears storage
  for sites you have not opened in a week, and installed apps are exempt.

The keys are `mf.v1.settings`, `mf.v1.active`, `mf.v1.sessions`,
`mf.v1.standards`, `mf.v1.delts` and `mf.v1.outbox`, if you ever want to poke
at them in the browser console.

## On the programme content

The exercise structure came out of the Lean Bastard PDF and the demo video
links are DeFranco's own. The coaching text in the app is written in my own
words rather than copied from the manual. Keep the site URL to yourself.
