# Michael Fitness

A workout logger that runs entirely in the browser. No server, no session to
lose. Every set is written to the phone's local storage the moment you log it,
so you can lock the screen, switch apps, take a twenty minute rest and come
back to exactly where you were.

## How it is organised

Three tiers, every time you open it:

```
Tier 1   What do you want to train?     Strength  |  Cardio
Tier 2   Which one?                      Lean Bastard · Standardized Strength · None
                                         Joner Soccer (more cardio later)
         then week + day (strength)  or  which session (cardio)
Tier 3   Add a challenge?                30 Days of Delts · Sleeve Season · None
```

**Strength → None → a challenge** is how a challenge-only day works.

**Logging for** sits above the two buttons on the opening screen and defaults
to today. Change it to back-date something you forgot to log: the date is
carried through every screen, stamped on the record, and used to work out which
challenge day it was. It resets to today once you have logged.

Each programme keeps its own place. Finishing the session the programme says is
next moves you on; running any other week or day is a one-off and leaves your
place alone. The week and day screen tells you which it is before you start.

Challenges run on their own 30-day calendars, independent of any programme.
Tapping one that has not started begins it with today as day 1. Delts attaches
to a lifting session (press hold before, lateral hold after) or gives you the
Y-hold on its own. Sleeve Season alternates by weekday: biceps Mon/Wed/Fri,
triceps Tue/Thu/Sat, Sunday off.

Cardio is a grid of numbered sessions. Tap the one you did, add a challenge if
you want, log it. That is all it does for now.

## The files

```
michael-fitness/
├── michael-fitness.Rproj   open this in RStudio
├── index.html              the whole app: styles, programme data, logic
├── manifest.json           lets it install to the home screen
├── sw.js                   offline caching (see "Updating" below)
├── sync.gs                 Google Apps Script, for the optional Sheet backup
├── robots.txt              keeps it out of search results
├── serve.R                 local preview, including on your phone over wifi
├── icons/                  home screen icons
└── README.md
```

## Running it locally

Open `michael-fitness.Rproj` in RStudio, then open `serve.R` and click Source.
It starts a local server and prints an address you can type into your phone on
the same wifi. Needs `install.packages("servr")` once.

## Putting it online

Push the folder contents to a GitHub repo, then Settings → Pages → deploy from
`main`, folder `/ (root)`. Open the URL on your phone in Safari and use Share →
Add to Home Screen. Run it from the icon, not a Safari tab: installed apps are
exempt from the seven-day storage clearout that hits ordinary tabs.

## Updating

**Bump `CACHE` in `sw.js` every time you change `index.html`.** It is currently
`mf-v11`; make it `mf-v12`, and so on. If you skip this, your phone keeps
serving the cached old version. After pushing, close the app fully from the app
switcher and reopen it, twice if needed.

## Look

The style is called Marker: warm white, black 2px borders, square corners, and
a flat block of colour behind the headline word on each screen. Colour has one
job, labelling where you are. Gold means yours (current programme, logged set,
your best). Red is Strength, green is Cardio, purple is a challenge or a rest
clock, lime is the next thing to do. The whole palette is a set of CSS variables
at the top of `index.html`, so a reskin is a CSS job, not a rebuild.

## Adding things

Everything the app trains is declared in the DATA block near the top of the
script. Nothing below it knows the names of specific programmes.

**A programme** goes in `PROGRAMMES`. Copy the shape of `lean_bastard`:
`id`, `name`, `by`, `short` (two letters for the row), `wname` (`'Workout'` or
`'Day'`), `weeks`, `order` (the session letters or numbers), `restMode:'manual'`
if the author prescribes no rest, and `phases`. A phase has a week range, a
`warmup` list, and `workouts` keyed by session. A workout is an array of blocks;
a block is one screen. A block whose title starts with `Superset`, or carries
`pair:true`, is rendered round by round.

Set kinds: `wr` weight and reps, `reps`, `time` (a stopwatch, with your best
above it), `check` (one Confirm button). `{bw:25}` anywhere in a string renders
as 25% of the bodyweight in Settings.

**A challenge** goes in `CHALLENGES`. It has `days`, a `colour`, a `blocks`
map, and either `onLift`/`onRest` functions of the day number (for a challenge
that attaches to lifting sessions) or a `byWeekday` function (for one that runs
on fixed days of the week). Each block has `pos` (`start`, `end` or `any`), `k`
(`time` or `reps`), optional `wr:true` to also log a weight, and `t`, a function
of the day returning the instruction text.

**A cardio course** goes in `CARDIO`, under a provider: `{ id, name, sessions }`.
Twelve numbered sessions is all the app needs to know.

## Backing up to a Google Sheet

Optional, and the app works fine without it. Once set up, finished sessions copy
themselves to a Sheet in the background with nothing to press.

1. Create a Google Sheet. Extensions → Apps Script. Delete the sample code.
2. Paste in the whole of `sync.gs`. **Press Cmd+S.**
3. Deploy → New deployment → Web app. Execute as **Me**, access **Anyone**.
4. Click through the "not verified" warning (Advanced → Go to project). It is
   your own script.
5. Copy the URL ending in `/exec` into Settings → Google Sheet backup.

If you edit `sync.gs` later: Deploy → Manage deployments → pencil → Version:
New version. Do not create a new deployment, that changes the URL. And save
first, every time.

The sheet gets two new columns with this version (`kind`, `challenges`). An
existing sheet is widened automatically the first time the new script runs.

On a new phone, paste the same URL into Settings and tap Restore from Sheet.

## Your data

Everything lives in `localStorage` on the one phone. Export CSV from History
gives you a copy any time; the Sheet sync is the better backup.
