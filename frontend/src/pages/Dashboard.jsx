import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

export default function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [currentTask, setCurrentTask] = useState({ title: '', description: '', status: 'pending' });
  const [loading, setLoading] = useState(true);

  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else {
      fetchTasks();
    }
  }, [user, navigate]);

  const fetchTasks = async () => {
    try {
      const { data } = await axios.get('/api/tasks');
      setTasks(data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      if(err.response?.status === 401) logout();
    }
  };

  const handleOpenModal = (task = null, mode = 'edit') => {
    if (task) {
      setModalMode(mode);
      setCurrentTask(task);
    } else {
      setModalMode('add');
      setCurrentTask({ title: '', description: '', status: 'pending' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentTask({ title: '', description: '', status: 'pending' });
  };

  const handleSubmitTask = async (e) => {
    e.preventDefault();
    try {
      if (modalMode === 'add') {
        const { data } = await axios.post('/api/tasks', currentTask);
        setTasks([data, ...tasks]);
      } else {
        const { data } = await axios.put(`/api/tasks/${currentTask._id}`, currentTask);
        setTasks(tasks.map((t) => (t._id === data._id ? data : t)));
      }
      handleCloseModal();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = async (id) => {
    try {
      await axios.delete(`/api/tasks/${id}`);
      setTasks((prevTasks) => prevTasks.filter((t) => t._id !== id));
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const toggleTaskStatus = async (task) => {
    const updatedStatus = task.status === 'pending' ? 'completed' : 'pending';
    try {
      const { data } = await axios.put(`/api/tasks/${task._id}`, { ...task, status: updatedStatus });
      setTasks(tasks.map((t) => (t._id === task._id ? data : t)));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="app-container">
      <header className="header">
        <h1 className="header-logo">TaskOS</h1>
        <div className="nav-links">
          <span>Welcome, {user?.username}</span>
          <button className="btn btn-danger" onClick={logout}>Logout</button>
        </div>
      </header>

      <main>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2>Your Tasks</h2>
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>
            + New Task
          </button>
        </div>

        {loading ? (
          <p className="text-center">Loading tasks...</p>
        ) : tasks.length === 0 ? (
          <div className="text-center" style={{ padding: '3rem', background: 'var(--surface)', borderRadius: '12px' }}>
            <p style={{ color: 'var(--text-muted)' }}>You have no tasks yet.</p>
            <button className="btn btn-primary mt-3" onClick={() => handleOpenModal()}>
              Create Your First Task
            </button>
          </div>
        ) : (
          <div className="tasks-grid">
            {tasks.map((task) => (
              <div key={task._id} className="task-card">
                <div className="task-header">
                  <span className="task-title" style={{ textDecoration: task.status === 'completed' ? 'line-through' : 'none', opacity: task.status === 'completed' ? 0.6 : 1 }}>
                    {task.title}
                  </span>
                  <span className={`task-status ${task.status === 'pending' ? 'status-pending' : 'status-completed'}`}>
                    {task.status}
                  </span>
                </div>
                <p className="task-desc">{task.description}</p>
                <div className="task-actions">
                  <button className="btn" style={{ background: task.status === 'pending' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: task.status === 'pending' ? 'var(--success)' : 'var(--danger)', marginRight: 'auto' }} onClick={() => toggleTaskStatus(task)}>
                    {task.status === 'pending' ? 'Mark Completed' : 'Mark Pending'}
                  </button>
                  <button className="btn" onClick={() => handleOpenModal(task, 'view')}>View</button>
                  <button className="btn" onClick={() => handleOpenModal(task, 'edit')}>Edit</button>
                  <button className="btn btn-danger" onClick={() => handleDeleteTask(task._id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {isModalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>
              {modalMode === 'add' ? 'Create New Task' : modalMode === 'edit' ? 'Edit Task' : 'View Task'}
            </h3>
            {modalMode === 'view' ? (
              <div>
                <div className="form-group">
                  <label className="form-label">Title</label>
                  <p style={{ fontSize: '1.1rem', fontWeight: '500' }}>{currentTask.title}</p>
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <p style={{ whiteSpace: 'pre-wrap' }}>{currentTask.description || 'No description provided.'}</p>
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <p>
                    <span className={`task-status ${currentTask.status === 'pending' ? 'status-pending' : 'status-completed'}`}>
                      {currentTask.status}
                    </span>
                  </p>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
                  <button type="button" className="btn btn-primary" onClick={handleCloseModal}>Close</button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitTask}>
                <div className="form-group">
                  <label className="form-label">Title</label>
                  <input
                    type="text"
                    className="form-control"
                    value={currentTask.title}
                    onChange={(e) => setCurrentTask({ ...currentTask, title: e.target.value })}
                    required
                    autoFocus
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    rows="4"
                    value={currentTask.description}
                    onChange={(e) => setCurrentTask({ ...currentTask, description: e.target.value })}
                  ></textarea>
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select
                    className="form-control"
                    value={currentTask.status}
                    onChange={(e) => setCurrentTask({ ...currentTask, status: e.target.value })}
                  >
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                  <button type="button" className="btn" onClick={handleCloseModal}>Cancel</button>
                  <button type="submit" className="btn btn-primary">
                    {modalMode === 'add' ? 'Save Task' : 'Update Task'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
