import { useEffect, useMemo, useState } from 'react'
import { taskApi } from './api'

const EMPTY_FORM = { title: '', description: '', status: 'TODO', dueDate: '' }
const STATUS_LABELS = { TODO: 'To do', IN_PROGRESS: 'In progress', DONE: 'Completed' }

function Icon({ name, size = 20 }) {
  const paths = {
    plus: <><path d="M12 5v14M5 12h14" /></>,
    search: <><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    clock: <><circle cx="12" cy="12" r="8" /><path d="M12 8v4l2.5 2" /></>,
    menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
    close: <><path d="m6 6 12 12M18 6 6 18" /></>,
    trash: <><path d="M5 7h14M10 11v5M14 11v5M8 7l1-2h6l1 2m-8 0 1 13h8l1-13" /></>,
    edit: <><path d="m5 16-.8 3.8L8 19l10.5-10.5a2.1 2.1 0 0 0-3-3L5 16Z" /><path d="m14 7 3 3" /></>,
    calendar: <><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M8 3v4M16 3v4M4 10h16" /></>,
    alert: <><path d="M12 4 21 20H3L12 4Z" /><path d="M12 10v4M12 17h.01" /></>,
  }
  return <svg aria-hidden="true" className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>
}

function TaskForm({ task, onSave, onCancel, saving }) {
  const [form, setForm] = useState(task || EMPTY_FORM)
  const isEditing = Boolean(task?.id)

  useEffect(() => setForm(task || EMPTY_FORM), [task])

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  function submit(event) {
    event.preventDefault()
    onSave(form)
  }

  return (
    <form className="task-form" onSubmit={submit}>
      <div className="form-heading">
        <div>
          <span className="eyebrow">{isEditing ? 'Update task' : 'New task'}</span>
          <h2>{isEditing ? 'Edit your task' : 'What needs to be done?'}</h2>
        </div>
        <button type="button" className="icon-button" onClick={onCancel} aria-label="Close form"><Icon name="close" /></button>
      </div>
      <label>Task title <input name="title" value={form.title} onChange={updateField} placeholder="e.g. Prepare project presentation" required autoFocus /></label>
      <label>Description <textarea name="description" value={form.description || ''} onChange={updateField} placeholder="Add a little more context..." rows="3" /></label>
      <div className="form-row">
        <label>Status
          <select name="status" value={form.status || 'TODO'} onChange={updateField}>
            {Object.entries(STATUS_LABELS).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
          </select>
        </label>
        <label>Due date <input type="date" name="dueDate" value={form.dueDate || ''} onChange={updateField} /></label>
      </div>
      <div className="form-actions">
        <button type="button" className="button secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="button primary" disabled={saving}>{saving ? 'Saving...' : isEditing ? 'Save changes' : 'Add task'}</button>
      </div>
    </form>
  )
}

function TaskCard({ task, onEdit, onDelete, onComplete }) {
  const isOverdue = task.dueDate && task.status !== 'DONE' && new Date(`${task.dueDate}T23:59:59`) < new Date()
  return (
    <article className={`task-card ${task.status === 'DONE' ? 'is-complete' : ''}`}>
      <button className={`task-check ${task.status === 'DONE' ? 'checked' : ''}`} onClick={() => onComplete(task)} aria-label={task.status === 'DONE' ? 'Mark task as incomplete' : 'Mark task as complete'}>
        {task.status === 'DONE' && <Icon name="check" size={15} />}
      </button>
      <div className="task-content">
        <div className="task-title-row"><h3>{task.title}</h3><span className={`status status-${task.status.toLowerCase()}`}>{STATUS_LABELS[task.status]}</span></div>
        {task.description && <p>{task.description}</p>}
        {task.dueDate && <span className={`due-date ${isOverdue ? 'overdue' : ''}`}><Icon name={isOverdue ? 'alert' : 'calendar'} size={14} />{isOverdue ? 'Overdue · ' : ''}{new Date(`${task.dueDate}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>}
      </div>
      <div className="task-actions">
        <button className="icon-button" onClick={() => onEdit(task)} aria-label={`Edit ${task.title}`}><Icon name="edit" size={17} /></button>
        <button className="icon-button danger-hover" onClick={() => onDelete(task)} aria-label={`Delete ${task.title}`}><Icon name="trash" size={17} /></button>
      </div>
    </article>
  )
}

function App() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [apiHealthy, setApiHealthy] = useState(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [filter, setFilter] = useState('ALL')
  const [search, setSearch] = useState('')
  const [formTask, setFormTask] = useState(null)
  const [saving, setSaving] = useState(false)
  const [mobileNav, setMobileNav] = useState(false)

  async function loadTasks() {
    setLoading(true)
    try {
      setTasks(await taskApi.list())
      setError('')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTasks()
    taskApi.health()
      .then(() => setApiHealthy(true))
      .catch(() => setApiHealthy(false))
  }, [])

  const counts = useMemo(() => ({
    ALL: tasks.length,
    TODO: tasks.filter((task) => task.status === 'TODO').length,
    IN_PROGRESS: tasks.filter((task) => task.status === 'IN_PROGRESS').length,
    DONE: tasks.filter((task) => task.status === 'DONE').length,
  }), [tasks])

  const visibleTasks = useMemo(() => tasks.filter((task) => {
    const matchesFilter = filter === 'ALL' || task.status === filter
    const query = search.trim().toLowerCase()
    return matchesFilter && (!query || `${task.title} ${task.description || ''}`.toLowerCase().includes(query))
  }), [tasks, filter, search])

  async function saveTask(form) {
    setSaving(true)
    try {
      const saved = formTask?.id ? await taskApi.update(formTask.id, form) : await taskApi.create(form)
      setTasks((current) => formTask?.id ? current.map((task) => task.id === saved.id ? saved : task) : [saved, ...current])
      setFormTask(null)
      setNotice(formTask?.id ? 'Task updated successfully.' : 'Task added successfully.')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  async function deleteTask(task) {
    if (!window.confirm(`Delete "${task.title}"?`)) return
    try {
      await taskApi.remove(task.id)
      setTasks((current) => current.filter((item) => item.id !== task.id))
      setNotice('Task deleted.')
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  async function toggleComplete(task) {
    const updated = { title: task.title, description: task.description || '', status: task.status === 'DONE' ? 'TODO' : 'DONE', dueDate: task.dueDate || '' }
    try {
      const saved = await taskApi.update(task.id, updated)
      setTasks((current) => current.map((item) => item.id === saved.id ? saved : item))
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  function showForm(task = null) {
    setError('')
    setFormTask(task || EMPTY_FORM)
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNav ? 'mobile-open' : ''}`}>
        <div className="brand"><div className="brand-mark"><Icon name="check" size={19} /></div><span>task<span>flow</span></span></div>
        <nav>
          <button className={`nav-item ${filter === 'ALL' ? 'active' : ''}`} onClick={() => { setFilter('ALL'); setMobileNav(false) }}><span className="nav-icon"><Icon name="menu" size={18} /></span>All tasks <b>{counts.ALL}</b></button>
          <button className="nav-item" onClick={() => { setFilter('TODO'); setMobileNav(false) }}><span className="nav-dot todo-dot" />To do <b>{counts.TODO}</b></button>
          <button className="nav-item" onClick={() => { setFilter('IN_PROGRESS'); setMobileNav(false) }}><span className="nav-dot progress-dot" />In progress <b>{counts.IN_PROGRESS}</b></button>
          <button className="nav-item" onClick={() => { setFilter('DONE'); setMobileNav(false) }}><span className="nav-dot done-dot" />Completed <b>{counts.DONE}</b></button>
        </nav>
        <div className="sidebar-bottom"><div className="mini-summary"><span><Icon name="clock" size={16} />Productivity</span><strong>{counts.ALL ? Math.round((counts.DONE / counts.ALL) * 100) : 0}%</strong><div className="progress-track"><div style={{ width: `${counts.ALL ? (counts.DONE / counts.ALL) * 100 : 0}%` }} /></div><small>Keep going, you’re doing great.</small></div><div className="profile"><div className="avatar">TF</div><div><strong>My workspace</strong><small>Personal space</small></div></div></div>
      </aside>
      <main className="main-content">
        <header className="topbar"><button className="mobile-menu icon-button" onClick={() => setMobileNav(!mobileNav)} aria-label="Open navigation"><Icon name="menu" /></button><div className="breadcrumb">Workspace <span>/</span> Tasks</div><div className="topbar-actions"><div className={`health-dot ${apiHealthy === false ? 'unhealthy' : ''}`} title={apiHealthy === false ? 'API unavailable' : apiHealthy === true ? 'Connected to API' : 'Checking API connection'} /><button className="avatar top-avatar">TF</button></div></header>
        <section className="page">
          <div className="page-heading"><div><span className="eyebrow">{new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date())}</span><h1>Good morning, <em>let’s get things done.</em></h1><p>Stay focused and make progress one task at a time.</p></div><button className="button primary add-button" onClick={() => showForm()}><Icon name="plus" size={18} /> Add task</button></div>
          {error && <div className="alert error"><Icon name="alert" size={17} />{error}<button onClick={() => setError('')} aria-label="Dismiss error"><Icon name="close" size={15} /></button></div>}
          {notice && <div className="alert success"><Icon name="check" size={17} />{notice}<button onClick={() => setNotice('')} aria-label="Dismiss notification"><Icon name="close" size={15} /></button></div>}
          <div className="stats"><div><span className="stat-icon purple"><Icon name="menu" size={18} /></span><div><small>Total tasks</small><strong>{counts.ALL}</strong></div></div><div><span className="stat-icon orange"><Icon name="clock" size={18} /></span><div><small>In progress</small><strong>{counts.IN_PROGRESS}</strong></div></div><div><span className="stat-icon green"><Icon name="check" size={18} /></span><div><small>Completed</small><strong>{counts.DONE}</strong></div></div></div>
          <div className="list-toolbar"><div className="tabs">{[['ALL', 'All tasks'], ['TODO', 'To do'], ['IN_PROGRESS', 'In progress'], ['DONE', 'Completed']].map(([value, label]) => <button key={value} className={filter === value ? 'selected' : ''} onClick={() => setFilter(value)}>{label}<span>{counts[value]}</span></button>)}</div><label className="search"><Icon name="search" size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search tasks..." /></label></div>
          {formTask !== null && <div className="form-panel"><TaskForm task={formTask} onSave={saveTask} onCancel={() => setFormTask(null)} saving={saving} /></div>}
          <div className="task-list">
            {loading ? <div className="empty-state"><div className="spinner" />Loading your tasks...</div> : visibleTasks.length ? visibleTasks.map((task) => <TaskCard key={task.id} task={task} onEdit={showForm} onDelete={deleteTask} onComplete={toggleComplete} />) : <div className="empty-state"><div className="empty-icon"><Icon name="check" size={25} /></div><h3>{search ? 'No matching tasks' : 'Your task list is clear'}</h3><p>{search ? 'Try another search term.' : 'Add a task to start making progress.'}</p>{!search && <button className="button secondary" onClick={() => showForm()}><Icon name="plus" size={16} /> Add your first task</button>}</div>}
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
