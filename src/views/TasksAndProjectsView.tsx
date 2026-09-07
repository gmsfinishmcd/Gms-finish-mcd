import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Radio,
  Plus,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Send,
  Sparkles,
  Calendar,
  Layers,
  ChevronRight,
  TrendingUp,
  Tag,
  Flame,
  UserCheck
} from 'lucide-react';
import type { UserTask, RealtimeProjectUpdate, ProjectOrder, TaskStatus, TaskPriority } from '../types.js';
import { useRealtime } from '../context/RealtimeContext.js';
import { useAuth } from '../context/AuthContext.js';

export const TasksAndProjectsView: React.FC = () => {
  const { user } = useAuth();
  const { isConnected, updates, triggerLiveBroadcast, simulateWarehouseActivity } = useRealtime();

  // State
  const [tasks, setTasks] = useState<UserTask[]>([]);
  const [projects, setProjects] = useState<ProjectOrder[]>([]);
  const [loadingTasks, setLoadingTasks] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'tasks' | 'projects' | 'live-feed'>('tasks');

  // Task creation form modal
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [newTaskForm, setNewTaskForm] = useState({
    title: '',
    description: '',
    assignee: user?.email || 'finishmcd@gmail.com',
    priority: 'HIGH' as TaskPriority,
    tagInput: 'Quality Check, MCD',
    dueDate: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
    storeRef: 'SR-2489'
  });

  // Live broadcast form
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastDesc, setBroadcastDesc] = useState('');
  const [broadcastType, setBroadcastType] = useState<RealtimeProjectUpdate['type']>('PROJECT_MILESTONE');
  const [isPostingBroadcast, setIsPostingBroadcast] = useState(false);

  // Load Tasks and Projects from API
  const fetchTasks = async () => {
    try {
      setLoadingTasks(true);
      const res = await fetch('/api/tasks');
      const ct = res.headers.get('content-type') || '';
      if (res.ok && ct.includes('application/json')) {
        const data = await res.json();
        setTasks(data.data || []);
      }
    } catch (err) {
      console.error('Error loading tasks:', err);
    } finally {
      setLoadingTasks(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects');
      const ct = res.headers.get('content-type') || '';
      if (res.ok && ct.includes('application/json')) {
        const data = await res.json();
        setProjects(data.data || []);
      }
    } catch (err) {
      console.error('Error loading projects:', err);
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchProjects();
  }, []);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const tags = newTaskForm.tagInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTaskForm.title,
          description: newTaskForm.description,
          assignee: newTaskForm.assignee,
          assigneeEmail: newTaskForm.assignee,
          priority: newTaskForm.priority,
          status: 'TODO' as TaskStatus,
          dueDate: newTaskForm.dueDate,
          storeRef: newTaskForm.storeRef,
          tags: tags.length > 0 ? tags : ['Warehouse Task']
        })
      });

      if (res.ok) {
        setIsTaskModalOpen(false);
        setNewTaskForm({
          title: '',
          description: '',
          assignee: user?.email || 'finishmcd@gmail.com',
          priority: 'MEDIUM',
          tagInput: 'Quality Check, MCD',
          dueDate: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
          storeRef: 'SR-2489'
        });
        fetchTasks();
      }
    } catch (err) {
      console.error('Failed to create task:', err);
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, newStatus: TaskStatus) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchTasks();
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      const res = await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
      if (res.ok) {
        setTasks((prev) => prev.filter((t) => t.id !== taskId));
      }
    } catch (err) {
      console.error('Delete task failed:', err);
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle) return;
    setIsPostingBroadcast(true);
    await triggerLiveBroadcast(broadcastTitle, broadcastDesc, broadcastType);
    setBroadcastTitle('');
    setBroadcastDesc('');
    setIsPostingBroadcast(false);
  };

  const todoTasks = tasks.filter((t) => t.status === 'TODO');
  const inProgressTasks = tasks.filter((t) => t.status === 'IN_PROGRESS');
  const underReviewTasks = tasks.filter((t) => t.status === 'UNDER_REVIEW');
  const completedTasks = tasks.filter((t) => t.status === 'COMPLETED');

  const getPriorityBadge = (p: TaskPriority) => {
    switch (p) {
      case 'URGENT':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'HIGH':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'MEDIUM':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-[1920px] mx-auto space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900">User Tasks & Real-Time Project Hub</h1>
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                isConnected
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                  : 'bg-amber-50 text-amber-700 border-amber-300'
              }`}
            >
              <span className="relative flex h-2 w-2">
                {isConnected && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                )}
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    isConnected ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                ></span>
              </span>
              {isConnected ? 'LIVE STREAM ACTIVE' : 'CONNECTING...'}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Coordinate warehouse workflows, dispatch assignments, and view instant live updates on buyer orders
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={simulateWarehouseActivity}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            title="Simulate a real-time event"
          >
            <Sparkles className="size-3.5 text-amber-500" />
            <span>Simulate Live Event</span>
          </button>

          <button
            id="create-task-btn"
            onClick={() => setIsTaskModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="size-4" />
            <span>New Task Assignment</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('tasks')}
          className={`pb-2.5 px-3 text-xs font-bold transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'tasks'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <CheckSquare className="size-4" />
          <span>Task Kanban ({tasks.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('projects')}
          className={`pb-2.5 px-3 text-xs font-bold transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'projects'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <Layers className="size-4" />
          <span>Active Project Orders ({projects.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('live-feed')}
          className={`pb-2.5 px-3 text-xs font-bold transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'live-feed'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <Radio className="size-4 text-emerald-600" />
          <span>Live Project Stream ({updates.length})</span>
        </button>
      </div>

      {/* TAB 1: KANBAN TASK BOARD */}
      {activeTab === 'tasks' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Column 1: TODO */}
          <div className="bg-gray-100/70 p-3.5 rounded-xl border border-gray-200 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-gray-500"></span>
                <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                  To Do ({todoTasks.length})
                </span>
              </div>
            </div>

            <div className="space-y-2.5 min-h-[350px]">
              {todoTasks.map((t) => (
                <div
                  key={t.id}
                  className="bg-white p-3 rounded-lg border border-gray-200 shadow-xs space-y-2 hover:border-emerald-300 transition-colors"
                >
                  <div className="flex items-start justify-between gap-1">
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${getPriorityBadge(
                        t.priority
                      )}`}
                    >
                      {t.priority}
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono">Due: {t.dueDate}</span>
                  </div>

                  <h3 className="text-xs font-bold text-gray-900">{t.title}</h3>
                  <p className="text-[11px] text-gray-600 leading-relaxed line-clamp-2">
                    {t.description}
                  </p>

                  <div className="flex flex-wrap gap-1">
                    {t.tags?.map((tag) => (
                      <span
                        key={tag}
                        className="text-[9px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 font-medium"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-[10px] pt-1.5 border-t border-gray-100">
                    <span className="font-semibold text-emerald-800 font-mono">
                      {t.storeRef || 'N/A'}
                    </span>
                    <span className="text-gray-500 truncate max-w-[120px]">
                      {t.assignee}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-1 pt-1">
                    <button
                      onClick={() => handleUpdateTaskStatus(t.id, 'IN_PROGRESS')}
                      className="w-full py-1 text-[11px] font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded transition-colors"
                    >
                      Start Task →
                    </button>
                    <button
                      onClick={() => handleDeleteTask(t.id)}
                      className="px-2 py-1 text-[11px] text-gray-400 hover:text-red-600"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}

              {todoTasks.length === 0 && (
                <div className="py-12 text-center text-xs text-gray-400">No tasks in queue</div>
              )}
            </div>
          </div>

          {/* Column 2: In Progress */}
          <div className="bg-blue-50/40 p-3.5 rounded-xl border border-blue-200/60 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-blue-200">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
                <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                  In Progress ({inProgressTasks.length})
                </span>
              </div>
            </div>

            <div className="space-y-2.5 min-h-[350px]">
              {inProgressTasks.map((t) => (
                <div
                  key={t.id}
                  className="bg-white p-3 rounded-lg border border-blue-200 shadow-xs space-y-2 hover:border-emerald-300 transition-colors"
                >
                  <div className="flex items-start justify-between gap-1">
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${getPriorityBadge(
                        t.priority
                      )}`}
                    >
                      {t.priority}
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono">Due: {t.dueDate}</span>
                  </div>

                  <h3 className="text-xs font-bold text-gray-900">{t.title}</h3>
                  <p className="text-[11px] text-gray-600 leading-relaxed line-clamp-2">
                    {t.description}
                  </p>

                  <div className="flex flex-wrap gap-1">
                    {t.tags?.map((tag) => (
                      <span
                        key={tag}
                        className="text-[9px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-medium"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-[10px] pt-1.5 border-t border-gray-100">
                    <span className="font-semibold text-emerald-800 font-mono">
                      {t.storeRef || 'N/A'}
                    </span>
                    <span className="text-gray-500 truncate max-w-[120px]">
                      {t.assignee}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-1 pt-1">
                    <button
                      onClick={() => handleUpdateTaskStatus(t.id, 'UNDER_REVIEW')}
                      className="w-full py-1 text-[11px] font-semibold bg-amber-50 hover:bg-amber-100 text-amber-800 rounded transition-colors"
                    >
                      To Review →
                    </button>
                    <button
                      onClick={() => handleUpdateTaskStatus(t.id, 'TODO')}
                      className="px-2 py-1 text-[11px] text-gray-500 hover:text-gray-700"
                    >
                      ←
                    </button>
                  </div>
                </div>
              ))}

              {inProgressTasks.length === 0 && (
                <div className="py-12 text-center text-xs text-gray-400">No active tasks</div>
              )}
            </div>
          </div>

          {/* Column 3: Under Review */}
          <div className="bg-amber-50/40 p-3.5 rounded-xl border border-amber-200/60 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-amber-200">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                  QA Review ({underReviewTasks.length})
                </span>
              </div>
            </div>

            <div className="space-y-2.5 min-h-[350px]">
              {underReviewTasks.map((t) => (
                <div
                  key={t.id}
                  className="bg-white p-3 rounded-lg border border-amber-200 shadow-xs space-y-2 hover:border-emerald-300 transition-colors"
                >
                  <div className="flex items-start justify-between gap-1">
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${getPriorityBadge(
                        t.priority
                      )}`}
                    >
                      {t.priority}
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono">Due: {t.dueDate}</span>
                  </div>

                  <h3 className="text-xs font-bold text-gray-900">{t.title}</h3>
                  <p className="text-[11px] text-gray-600 leading-relaxed line-clamp-2">
                    {t.description}
                  </p>

                  <div className="flex items-center justify-between gap-1 pt-1">
                    <button
                      onClick={() => handleUpdateTaskStatus(t.id, 'COMPLETED')}
                      className="w-full py-1 text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded transition-colors flex items-center justify-center gap-1"
                    >
                      <CheckCircle2 className="size-3" />
                      <span>Approve & Done</span>
                    </button>
                    <button
                      onClick={() => handleUpdateTaskStatus(t.id, 'IN_PROGRESS')}
                      className="px-2 py-1 text-[11px] text-gray-500 hover:text-gray-700"
                    >
                      ←
                    </button>
                  </div>
                </div>
              ))}

              {underReviewTasks.length === 0 && (
                <div className="py-12 text-center text-xs text-gray-400">No reviews pending</div>
              )}
            </div>
          </div>

          {/* Column 4: Completed */}
          <div className="bg-emerald-50/40 p-3.5 rounded-xl border border-emerald-200/60 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-emerald-200">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                  Completed ({completedTasks.length})
                </span>
              </div>
            </div>

            <div className="space-y-2.5 min-h-[350px]">
              {completedTasks.map((t) => (
                <div
                  key={t.id}
                  className="bg-white/90 p-3 rounded-lg border border-emerald-200 shadow-xs space-y-2 opacity-85"
                >
                  <div className="flex items-start justify-between gap-1">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      DONE
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono">Archived</span>
                  </div>

                  <h3 className="text-xs font-bold text-gray-700 line-through">
                    {t.title}
                  </h3>
                  <p className="text-[11px] text-gray-500 line-clamp-2">{t.description}</p>

                  <div className="flex items-center justify-between text-[10px] pt-1 border-t border-gray-100 text-gray-400">
                    <span>{t.storeRef || 'N/A'}</span>
                    <button
                      onClick={() => handleDeleteTask(t.id)}
                      className="hover:text-red-600 text-[10px]"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}

              {completedTasks.length === 0 && (
                <div className="py-12 text-center text-xs text-gray-400">No completed tasks yet</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ACTIVE PROJECT ORDERS PROGRESS */}
      {activeTab === 'projects' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {projects.map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                      {p.orderNumber}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        p.status === 'Completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : p.status === 'Cutting In Progress'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-gray-900">{p.styleName}</h3>
                  <p className="text-xs text-gray-500 font-medium">
                    {p.buyerName} • Store: {p.storeRef}
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-xs mt-3 p-2.5 bg-gray-50 rounded-lg">
                    <div>
                      <span className="text-gray-400 text-[10px] block">CUTTING TARGET</span>
                      <span className="font-bold text-gray-800">
                        {p.cuttingTargetPcs?.toLocaleString()} Pcs
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 text-[10px] block">TOTAL BOOKING</span>
                      <span className="font-bold text-gray-800">
                        {p.totalBookingKg?.toLocaleString()} Kg
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 text-[10px] block">RECEIVED</span>
                      <span className="font-extrabold text-emerald-700">{p.receivedKg} Kg</span>
                    </div>
                    <div>
                      <span className="text-gray-400 text-[10px] block">DELIVERED</span>
                      <span className="font-extrabold text-blue-700">{p.deliveredKg} Kg</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100 space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-gray-600">Fabric Fulfillment</span>
                    <span className="text-emerald-700">{p.progressPercent}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${p.progressPercent}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-400 pt-0.5">
                    <span>Target Shipment: {p.shipmentDate}</span>
                    <span>Manager: {p.manager}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: LIVE REAL-TIME PROJECT UPDATES FEED */}
      {activeTab === 'live-feed' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Broadcast Form */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
              <Radio className="size-4 text-emerald-600 animate-pulse" />
              <h2 className="text-sm font-bold text-gray-900">Broadcast Live Project Update</h2>
            </div>
            <p className="text-xs text-gray-500">
              Publish a live announcement, quality milestone, or delivery alert instantly to all connected warehouse screens
            </p>

            <form onSubmit={handleSendBroadcast} className="space-y-3">
              <div>
                <label htmlFor="broadcast-title-input" className="block text-xs font-semibold text-gray-700 mb-1">
                  Update Title *
                </label>
                <input
                  id="broadcast-title-input"
                  type="text"
                  placeholder="e.g. Batch B-2405 Shade Approved"
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  required
                  className="w-full text-xs px-2.5 py-2 rounded-lg border border-gray-300 focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label htmlFor="broadcast-type-select" className="block text-xs font-semibold text-gray-700 mb-1">
                  Update Category *
                </label>
                <select
                  id="broadcast-type-select"
                  value={broadcastType}
                  onChange={(e) =>
                    setBroadcastType(e.target.value as RealtimeProjectUpdate['type'])
                  }
                  className="w-full text-xs px-2.5 py-2 rounded-lg border border-gray-300 focus:ring-1 focus:ring-emerald-500 outline-none"
                >
                  <option value="PROJECT_MILESTONE">PROJECT MILESTONE</option>
                  <option value="FABRIC_RECEIVED">FABRIC RECEIVED</option>
                  <option value="DELIVERY_DISPATCHED">DELIVERY DISPATCHED</option>
                  <option value="TRANSFER_DONE">ORDER TRANSFER</option>
                  <option value="QUALITY_ALERT">QUALITY & LAB ALERT</option>
                  <option value="TASK_UPDATED">TASK UPDATED</option>
                </select>
              </div>

              <div>
                <label htmlFor="broadcast-desc-input" className="block text-xs font-semibold text-gray-700 mb-1">
                  Detailed Notes / Description
                </label>
                <textarea
                  id="broadcast-desc-input"
                  rows={3}
                  placeholder="Provide context for supervisors and cutting masters..."
                  value={broadcastDesc}
                  onChange={(e) => setBroadcastDesc(e.target.value)}
                  className="w-full text-xs px-2.5 py-2 rounded-lg border border-gray-300 focus:ring-1 focus:ring-emerald-500 outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isPostingBroadcast || !broadcastTitle}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <Send className="size-3.5" />
                <span>Publish Real-Time Update</span>
              </button>
            </form>
          </div>

          {/* Right: Live Stream Feed */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-xs p-5 flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                <h2 className="text-sm font-bold text-gray-900">Live SSE Project Stream</h2>
              </div>
              <span className="text-[11px] font-medium text-gray-400">Auto-synced via Server-Sent Events</span>
            </div>

            <div className="space-y-3 overflow-y-auto max-h-[500px] pr-1 scrollbar-thin flex-1">
              {updates.map((u) => (
                <div
                  key={u.id}
                  className="p-3.5 bg-gray-50 rounded-lg border border-gray-200 hover:border-emerald-300 transition-colors space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                      {u.type.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono">
                      {new Date(u.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </span>
                  </div>

                  <h3 className="text-xs font-bold text-gray-900">{u.title}</h3>
                  <p className="text-xs text-gray-600 leading-relaxed">{u.description}</p>

                  <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1 border-t border-gray-100">
                    <span>Sender: {u.author}</span>
                    <span className="text-emerald-700 font-medium">Synced</span>
                  </div>
                </div>
              ))}

              {updates.length === 0 && (
                <div className="py-12 text-center text-xs text-gray-400">
                  No live stream events recorded yet.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* New Task Assignment Modal */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-gray-300">
            <div className="flex items-start justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-bold text-gray-900">Create Task Assignment</h3>
                <p className="text-xs text-gray-500">Assign warehouse duty to staff or cutting supervisor</p>
              </div>
              <button
                onClick={() => setIsTaskModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3">
              <div>
                <label htmlFor="new-task-title" className="block text-xs font-semibold text-gray-700 mb-1">
                  Task Title *
                </label>
                <input
                  id="new-task-title"
                  type="text"
                  placeholder="e.g. Inspect Batch B-2409 GSM & Bowing"
                  value={newTaskForm.title}
                  onChange={(e) => setNewTaskForm({ ...newTaskForm, title: e.target.value })}
                  required
                  className="w-full text-xs px-2.5 py-2 rounded border border-gray-300 focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label htmlFor="new-task-desc" className="block text-xs font-semibold text-gray-700 mb-1">
                  Description / Instructions
                </label>
                <textarea
                  id="new-task-desc"
                  rows={2}
                  placeholder="Specific rolls or parameters to inspect..."
                  value={newTaskForm.description}
                  onChange={(e) =>
                    setNewTaskForm({ ...newTaskForm, description: e.target.value })
                  }
                  className="w-full text-xs px-2.5 py-2 rounded border border-gray-300 focus:ring-1 focus:ring-emerald-500 outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="new-task-assignee" className="block text-xs font-semibold text-gray-700 mb-1">
                    Assign To
                  </label>
                  <input
                    id="new-task-assignee"
                    type="text"
                    value={newTaskForm.assignee}
                    onChange={(e) =>
                      setNewTaskForm({ ...newTaskForm, assignee: e.target.value })
                    }
                    className="w-full text-xs px-2.5 py-2 rounded border border-gray-300 focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="new-task-priority" className="block text-xs font-semibold text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    id="new-task-priority"
                    value={newTaskForm.priority}
                    onChange={(e) =>
                      setNewTaskForm({
                        ...newTaskForm,
                        priority: e.target.value as TaskPriority
                      })
                    }
                    className="w-full text-xs px-2.5 py-2 rounded border border-gray-300 focus:ring-1 focus:ring-emerald-500 outline-none"
                  >
                    <option value="URGENT">URGENT</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="new-task-store-ref" className="block text-xs font-semibold text-gray-700 mb-1">
                    Store Ref
                  </label>
                  <input
                    id="new-task-store-ref"
                    type="text"
                    value={newTaskForm.storeRef}
                    onChange={(e) =>
                      setNewTaskForm({ ...newTaskForm, storeRef: e.target.value })
                    }
                    className="w-full text-xs px-2.5 py-2 rounded border border-gray-300 focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="new-task-due-date" className="block text-xs font-semibold text-gray-700 mb-1">
                    Due Date
                  </label>
                  <input
                    id="new-task-due-date"
                    type="date"
                    value={newTaskForm.dueDate}
                    onChange={(e) =>
                      setNewTaskForm({ ...newTaskForm, dueDate: e.target.value })
                    }
                    className="w-full text-xs px-2.5 py-2 rounded border border-gray-300 focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="new-task-tags" className="block text-xs font-semibold text-gray-700 mb-1">
                  Tags (comma separated)
                </label>
                <input
                  id="new-task-tags"
                  type="text"
                  placeholder="e.g. Zara, Shade Test, Cutting"
                  value={newTaskForm.tagInput}
                  onChange={(e) =>
                    setNewTaskForm({ ...newTaskForm, tagInput: e.target.value })
                  }
                  className="w-full text-xs px-2.5 py-2 rounded border border-gray-300 focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="border-t pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold shadow-xs cursor-pointer"
                >
                  Create & Dispatch Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
