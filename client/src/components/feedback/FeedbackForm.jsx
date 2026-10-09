import { useState } from 'react';
import { categories } from '../../services/feedback.js';
import { api } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { ErrorMessage } from '../common/States.jsx';
export default function FeedbackForm({ onClose, onCreated }) {
  const [title, setTitle] = useState(''); const [description, setDescription] = useState(''); const [category, setCategory] = useState('feature'); const [pending, setPending] = useState(false); const [error, setError] = useState('');
  const { clearSession } = useAuth();
  async function submit(event) {
    event.preventDefault(); setError('');
    if (title.trim().length < 5 || title.trim().length > 100) { setError('Title must be 5–100 characters.'); return; }
    if (description.trim().length < 20 || description.trim().length > 2000) { setError('Description must be 20–2000 characters.'); return; }
    setPending(true);
    try { const result = await api('/feedback', { method: 'POST', body: { title: title.trim(), description: description.trim(), category } }); onCreated(result.data); }
    catch (problem) { if (problem.status === 401) clearSession(); setError(problem.message); }
    finally { setPending(false); }
  }
  return <form className="feedback-form" onSubmit={submit}><p className="muted">Tell us what would make FeedbackFlow better. New requests appear as Under Review.</p><label className="field-label" htmlFor="feedback-title">Feedback title <span aria-hidden="true">*</span></label><input id="feedback-title" value={title} onChange={event => setTitle(event.target.value)} required minLength={5} maxLength={100} placeholder="A short, clear title for your idea" /><span className="field-hint">{title.length} / 100 characters</span><fieldset className="category-field"><legend className="field-label">Category <span aria-hidden="true">*</span></legend><div className="category-options">{categories.map(value => <label className={category === value ? 'selected' : ''} key={value}><input type="radio" name="category" value={value} checked={category === value} onChange={() => setCategory(value)} />{value}</label>)}</div></fieldset><label className="field-label" htmlFor="feedback-description">Description <span aria-hidden="true">*</span></label><textarea id="feedback-description" value={description} onChange={event => setDescription(event.target.value)} required minLength={20} maxLength={2000} rows={6} placeholder="Describe the problem and how this would help your workflow." /><span className="field-hint">{description.length} / 2000 characters</span>{error && <ErrorMessage message={error} />}<div className="modal-actions"><button className="button button-light" type="button" onClick={onClose}>Cancel</button><button className="button button-primary" type="submit" disabled={pending}>{pending ? 'Submitting…' : 'Submit Feedback'}</button></div></form>;
}
