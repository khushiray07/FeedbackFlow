import { CATEGORIES } from '../src/models/constants.js';

export const DEMO_USERS = [
  'Maya Chen', 'Jordan Rivera', 'Amina Yusuf', 'Leo Martins', 'Priya Shah', 'Noah Kim',
  'Sofia Alvarez', 'Ethan Brooks', 'Zara Ahmed', 'Oliver Reed', 'Nia Okafor', 'Arjun Patel',
  'Ella Thompson', 'Mateo Silva', 'Hana Suzuki', 'Samira Hassan', 'Luca Moretti', 'Grace Park',
];

const groups = [
  ['under_review', [
    ['Add keyboard shortcuts to the feedback board', 'Let power users open search, move between cards, and submit a new idea without reaching for the mouse.', 8],
    ['Show a clearer duplicate suggestion while posting', 'Suggest similar requests as someone types a title so that votes collect on one shared idea.', 15],
    ['Support a compact board view', 'Offer a denser layout that shows more requests on a laptop screen without hiding category or vote count.', 6],
    ['Let users follow a request without voting', 'Provide a separate way to track progress on an idea when a user does not want to upvote it.', 12],
    ['Improve contrast on status badges', 'Increase text contrast for roadmap status labels so they stay legible on lower quality displays.', 4],
    ['Add a visible reset button for board filters', 'Make it easy to clear search, category, and status selections together after exploring the board.', 10],
    ['Show helpful guidance when a search has no matches', 'Include practical search tips and a clear way back to all requests when filters return nothing.', 3],
    ['Remember the preferred board sort order', 'Keep a visitor’s newest or most voted preference when they return to the feedback board.', 9],
    ['Support longer words in feedback titles on mobile', 'Prevent long product names from overflowing feedback cards on narrow phone screens.', 2],
    ['Clarify the difference between bugs and improvements', 'Add short category descriptions in the submission form so requests are filed consistently.', 7],
    ['Offer a printable roadmap summary', 'Provide a clean print view for sharing the current roadmap during customer review meetings.', 1],
    ['Show when a request last changed status', 'Display the most recent roadmap movement date so followers can tell when progress happened.', 5],
  ]],
  ['planned', [
    ['Add weekly roadmap email summaries', 'Send a concise opt-in digest when tracked requests move to a new roadmap status.', 17],
    ['Introduce saved feedback searches', 'Let signed-in users save combinations of search terms and filters for repeated review.', 11],
    ['Improve search matching for related words', 'Return relevant requests when visitors search for common variations of the same feature term.', 14],
    ['Add category totals beside board filters', 'Show how many requests are in each category before a visitor applies a board filter.', 8],
    ['Explain roadmap status changes in context', 'Include a short reason when an administrator moves a request between roadmap stages.', 13],
    ['Provide a dedicated integration request template', 'Guide people to include the external tool and workflow when proposing a new integration.', 6],
    ['Make pagination position easier to understand', 'Show the current result range alongside the total number of matching requests.', 4],
    ['Add an accessible high contrast theme', 'Offer stronger text and border contrast for people who need a more distinct interface.', 10],
    ['Surface newly completed ideas on the board', 'Highlight recently shipped requests so users can quickly see what changed this month.', 7],
    ['Improve validation hints before submission', 'Show title and description requirements as users type instead of only after submitting.', 9],
  ]],
  ['in_progress', [
    ['Speed up most voted sorting on large boards', 'Keep vote-ranked discovery responsive as the number of requests and votes grows.', 16],
    ['Add better mobile roadmap navigation', 'Make it easier to move between roadmap stages while preserving the selected stage on small screens.', 12],
    ['Show vote state more clearly after refresh', 'Make a user’s existing vote immediately visible when they return to a request detail page.', 10],
    ['Improve feedback card loading placeholders', 'Use placeholders that match the final card layout and reduce visual movement while loading.', 5],
    ['Provide clearer expired-session recovery', 'Explain when a session expires and return the user to the action they were trying to complete.', 14],
    ['Optimize combined search and status filters', 'Keep search results accurate and fast when visitors narrow by both category and roadmap status.', 11],
    ['Strengthen form focus handling in dialogs', 'Keep keyboard focus inside the submission dialog and return it to the opening control afterward.', 8],
    ['Make admin status updates easier to scan', 'Highlight a row briefly after an administrator successfully changes its roadmap status.', 6],
    ['Improve feedback detail links in roadmap cards', 'Increase the clickable title area so roadmap cards are easier to open on touch devices.', 4],
    ['Show a clear retry action for network failures', 'Give visitors a visible retry control when a feedback or roadmap request cannot be loaded.', 7],
  ]],
  ['completed', [
    ['Launch the public feedback board', 'Publish a searchable board where visitors can read requests and see community vote totals.', 17],
    ['Support secure account registration and login', 'Allow members to create an account and return with a cookie-backed session.', 15],
    ['Enable one vote per user per request', 'Keep votes persistent and prevent duplicate votes even when requests arrive together.', 16],
    ['Publish the four-stage product roadmap', 'Group feedback into Under Review, Planned, In Progress, and Completed stages.', 13],
    ['Add feedback category and status filters', 'Let visitors combine category and roadmap stage filters when browsing requests.', 12],
    ['Show full feedback details on a dedicated page', 'Provide a shareable page with the complete description, author, status, and vote count.', 9],
    ['Add administrator status management', 'Allow authorized administrators to update request stages and refresh roadmap totals.', 11],
    ['Make feedback pages work on phones', 'Adapt navigation, cards, forms, and roadmap lanes to narrow mobile screens.', 8],
  ]],
];

const anchor = Date.parse('2026-10-08T12:00:00.000Z');
export const DEMO_FEEDBACK = groups.flatMap(([status, items]) => items.map(([title, description, voteCount]) => ({
  title: `[Demo] ${title}`,
  description,
  voteCount,
  status,
}))).map((item, index) => ({
  ...item,
  category: CATEGORIES[index % CATEGORIES.length],
  createdAt: new Date(anchor - index * 2.5 * 24 * 60 * 60 * 1000),
}));
