import User from './User.js';
import Feedback from './Feedback.js';
import Vote from './Vote.js';

export async function initializeModels() {
  // Create missing indexes without dropping existing ones. Uniqueness must be
  // enforced by MongoDB before the application accepts writes.
  await Promise.all([User.init(), Feedback.init(), Vote.init()]);
}
