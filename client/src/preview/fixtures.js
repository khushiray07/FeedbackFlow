// Presentation-only records for M7. M8/M9 replace these with API responses.
export const previewFeedback = [
  { id: 'preview-1', title: 'Slack webhook notifications for deployment alerts', description: 'Send a clear notification when a deployment begins, succeeds, or needs attention so teams can respond quickly.', category: 'integration', status: 'in_progress', author: 'Devon Lee', date: 'Oct 8, 2026', voteCount: 248 },
  { id: 'preview-2', title: 'Custom CSV variables and theming in embedded public roadmap widget', description: 'Let teams match the roadmap to their product and choose which feedback fields appear in exports.', category: 'feature', status: 'planned', author: 'Clara Smith', date: 'Oct 7, 2026', voteCount: 183 },
  { id: 'preview-3', title: 'Fix mobile Safari date picker crash on iOS 18 release candidates', description: 'Opening the date picker can close the feedback form before a request is saved.', category: 'bug', status: 'under_review', author: 'Michael Chen', date: 'Oct 5, 2026', voteCount: 92 },
  { id: 'preview-4', title: 'Two-factor authentication for Security Keys', description: 'Add stronger account protection with passkeys and hardware security keys.', category: 'feature', status: 'completed', author: 'Marcus Vance', date: 'Sep 29, 2026', voteCount: 84 },
  { id: 'preview-5', title: 'Keyboard navigation shortcuts across the feedback board', description: 'Make it easier to search, open, and review feedback with a keyboard.', category: 'improvement', status: 'under_review', author: 'Alex Rivera', date: 'Sep 22, 2026', voteCount: 41 },
];
export const statusLabels = { under_review: 'Under Review', planned: 'Planned', in_progress: 'In Progress', completed: 'Completed' };
export const categories = ['feature', 'improvement', 'bug', 'integration'];
