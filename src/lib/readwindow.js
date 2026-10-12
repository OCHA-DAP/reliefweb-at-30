import archive from '$lib/data/archive.json';

// One wording for the document-level read measure, from the data, so every chart
// that uses it says the same thing. Pipelines: ga_months.py chooses the months.
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const month = (ym, names = MONTHS) => `${names[+ym.slice(5, 7) - 1]} ${ym.slice(0, 4)}`;
const list = (xs) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);

const [from, to] = archive.still_worth.window;
const NUM = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
// The threshold, from the pipeline (ga_months.READ_MIN), in words.
export const readMin = archive.still_worth.read_min ?? 5;
export const readMinWord = NUM[readMin] ?? String(readMin);
// "viewed three or more times", for running text.
export const readTimes = `viewed ${readMinWord} or more times`;
const excluded = archive.still_worth.excluded_months ?? [];

// "Aug 2025 – Aug 2026", for subtitles.
export const readWindowShort = `${month(from, SHORT)} – ${month(to, SHORT)}`;
// "between August 2025 and August 2026", for running text.
export const readWindowText = `between ${month(from)} and ${month(to)}`;
// The footnote sentence that defines "viewed" and the months left out.
export const readDefinition =
  `A document counts as viewed if its page had at least ${readMinWord} engaged visits (visits lasting over 10 seconds or going on to a second page) ${readWindowText}, matched to Google Analytics by page address.` +
  (excluded.length
    ? ` ${list(excluded.map((m) => month(m)))} are left out: in each, automated traffic swept through the archive, opening most old documents once or twice.`
    : '');
