import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, Circle, Plus, Calendar, User, Trash2, Loader2, AlertCircle } from 'lucide-react';
import type { FollowUpTask, UserProfile } from '../types';
import { getUsersByCras } from '../services/authService';
import { updatePAFTasks } from '../services/pafService';
import { useAuth } from '../AuthProvider';

interface TasksModalProps {
  isOpen: boolean;
  onClose: () => void;
  pafId: string;
  initialTasks: FollowUpTask[];
  responsavel: string;
  unidadeCras: string;
}

export default function TasksModal({ 
  isOpen, 
  onClose, 
  pafId, 
  initialTasks, 
  responsavel,
  unidadeCras
}: TasksModalProps) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<FollowUpTask[]>([]);
  const [teamMembers, setTeamMembers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [saving, setSaving] = useState(false);

  // New task form state
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    assignedTo: '',
    dueDate: ''
  });

  useEffect(() => {
    if (isOpen) {
      setTasks(initialTasks || []);
      fetchTeamMembers();
    }
  }, [isOpen, initialTasks]);

  const fetchTeamMembers = async () => {
    try {
      const members = await getUsersByCras(unidadeCras);
      setTeamMembers(members);
      if (members.length > 0 && !newTask.assignedTo) {
        setNewTask(prev => ({ ...prev, assignedTo: members[0].id }));
      }
    } catch (error) {
      console.error('Error fetching team members:', error);
    }
  };

  const handleAddTask = async () => {
    if (!newTask.title || !newTask.assignedTo) return;

    setSaving(true);
    const assignedMember = teamMembers.find(m => m.id === newTask.assignedTo);
    
    const task: FollowUpTask = {
      id: crypto.randomUUID(),
      title: newTask.title,
      description: newTask.description,
      assignedTo: newTask.assignedTo,
      assignedToName: assignedMember?.name || 'Desconhecido',
      dueDate: newTask.dueDate,
      completed: false,
      createdAt: new Date().toISOString()
    };

    const updatedTasks = [...tasks, task];
    try {
      await updatePAFTasks(pafId, updatedTasks);
      setTasks(updatedTasks);
      setNewTask({ title: '', description: '', assignedTo: teamMembers[0]?.id || '', dueDate: '' });
      setIsAdding(false);
    } catch (error) {
      alert('Erro ao adicionar tarefa.');
    } finally {
      setSaving(false);
    }
  };

  const toggleTask = async (taskId: string) => {
    const updatedTasks = tasks.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          completed: !t.completed,
          completedAt: !t.completed ? new Date().toISOString() : undefined
        };
      }
      return t;
    });

    try {
      await updatePAFTasks(pafId, updatedTasks);
      setTasks(updatedTasks);
    } catch (error) {
      alert('Erro ao atualizar tarefa.');
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta tarefa?')) return;

    const updatedTasks = tasks.filter(t => t.id !== taskId);
    try {
      await updatePAFTasks(pafId, updatedTasks);
      setTasks(updatedTasks);
    } catch (error) {
      alert('Erro ao excluir tarefa.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-50 border-b border-slate-200 p-6 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <CheckCircle2 className="text-brand-primary" size={24} />
              Acompanhamento de Tarefas
            </h2>
            <p className="text-slate-500 text-sm mt-1">Plano de: <span className="font-semibold text-slate-700">{responsavel}</span></p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          {/* Add Task Button or Form */}
          {!isAdding ? (
            <button 
              onClick={() => setIsAdding(true)}
              className="w-full py-4 border-2 border-dashed border-slate-200 rounded-xl text-slate-500 hover:text-brand-primary hover:border-brand-primary hover:bg-brand-light/10 transition-all flex items-center justify-center gap-2 font-bold mb-6"
            >
              <Plus size={20} />
              Nova Tarefa de Acompanhamento
            </button>
          ) : (
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 mb-6 space-y-4 animate-in slide-in-from-top-2 duration-200">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-slate-800">Nova Tarefa</h3>
                <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={18} />
                </button>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Título da Tarefa</label>
                  <input 
                    type="text"
                    value={newTask.title}
                    onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                    placeholder="Ex: Realizar visita domiciliar"
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Responsável</label>
                  <select 
                    value={newTask.assignedTo}
                    onChange={(e) => setNewTask({...newTask, assignedTo: e.target.value})}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none"
                  >
                    {teamMembers.map(member => (
                      <option key={member.id} value={member.id}>{member.name} ({member.role})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Prazo</label>
                    <input 
                      type="date"
                      value={newTask.dueDate}
                      onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Descrição (opcional)</label>
                  <textarea 
                    value={newTask.description}
                    onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none resize-none"
                    rows={2}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button 
                  onClick={() => setIsAdding(false)}
                  className="px-4 py-2 text-slate-500 font-bold hover:bg-slate-200 rounded-lg transition"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleAddTask}
                  disabled={!newTask.title || saving}
                  className="bg-brand-primary hover:bg-brand-secondary text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition disabled:opacity-50"
                >
                  {saving ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
                  Salvar Tarefa
                </button>
              </div>
            </div>
          )}

          {/* Task List */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Tarefas Registradas</h3>
            
            {tasks.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-100">
                <AlertCircle className="mx-auto text-slate-300 mb-2" size={32} />
                <p className="text-slate-400 text-sm italic">Nenhuma tarefa pendente para este plano.</p>
              </div>
            ) : (
              tasks.sort((a, b) => (a.completed === b.completed ? 0 : a.completed ? 1 : -1)).map((task) => (
                <div 
                  key={task.id} 
                  className={`group flex items-start gap-4 p-4 rounded-xl border transition-all ${
                    task.completed 
                      ? 'bg-slate-50 border-slate-100' 
                      : 'bg-white border-slate-200 hover:border-brand-primary/30 shadow-sm'
                  }`}
                >
                  <button 
                    onClick={() => toggleTask(task.id)}
                    className={`mt-1 shrink-0 transition-colors ${
                      task.completed ? 'text-green-500' : 'text-slate-300 hover:text-brand-primary'
                    }`}
                  >
                    {task.completed ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                  </button>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className={`font-bold text-sm truncate ${task.completed ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                        {task.title}
                      </h4>
                      <button 
                        onClick={() => deleteTask(task.id)}
                        className="p-1.5 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    
                    {task.description && (
                      <p className={`text-xs mt-1 mb-2 ${task.completed ? 'text-slate-400' : 'text-slate-500'}`}>
                        {task.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase">
                        <User size={12} />
                        {task.assignedToName}
                      </div>
                      
                      {task.dueDate && (
                        <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase ${
                          task.completed 
                            ? 'text-slate-400' 
                            : new Date(task.dueDate) < new Date() 
                              ? 'text-red-500 animate-pulse' 
                              : 'text-brand-primary'
                        }`}>
                          <Calendar size={12} />
                          Prazo: {new Date(task.dueDate + 'T12:00:00').toLocaleDateString('pt-BR')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 flex justify-end">
          <button 
            onClick={onClose}
            className="px-8 py-3 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl shadow-lg transition-transform active:scale-95"
          >
            Concluído
          </button>
        </div>
      </div>
    </div>
  );
}
