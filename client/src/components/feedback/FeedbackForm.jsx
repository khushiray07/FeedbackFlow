import { useState } from 'react';
import { categories } from '../../preview/fixtures.js';

export default function FeedbackForm({ onClose }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('feature');
  return <form className="feedback-form" onSubmit={event => event.preventDefault()}>
    <p className="muted">Tell us what would make FeedbackFlow better. Submission connects to the API in the next milestone.</p>
    <label className="field-label" htmlFor="feedback-title">Feedback title <span aria-hidden="true">*</span></label>
    <input id="feedback-title" value={title} onChange={event => setTitle(event.target.value)} minLength={5} maxLength={100} placeholder="A short, clear title for your idea" />
    <span className="field-hint">{title.length} / 100 characters</span>
    <fieldset className="category-field"><legend className="field-label">Category <span aria-hidden="true">*</span></legend><div className="category-options">{categories.map(value => <label className={category === value ? 'selected' : ''} key={value}><input type="radio" name="category" value={value} checked={category === value} onChange={() => setCategory(value)} />{value}</label>)}</div></fieldset>
    <label className="field-label" htmlFor="feedback-description">Description <span aria-hidden="true">*</span></label>
    <textarea id="feedback-description" value={description} onChange={event => setDescription(event.target.value)} minLength={20} maxLength={2000} rows={6} placeholder="Describe the problem and how this would help your workflow." />
    <span className="field-hint">{description.length} / 2000 characters</span>
    <div className="modal-actions"><button className="button button-light" type="button" onClick={onClose}>Cancel</button><button className="button button-primary" type="submit" disabled title="Submission will be connected in M8">Submit Feedback</button></div>
  </form>;
}
