'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Calendar, ChevronDown, Plus, Send, Save, AlertCircle } from 'lucide-react';
import { 
  Project, 
  StandardPhase, 
  TimeEntry, 
  Timesheet, 
  GroupedTimeEntries 
} from '@/lib/supabase/types';

interface TimeSheetFormProps {
  timesheetId: string;
}

// Helper function to determine if a date is a weekend
const isWeekend = (dateString: string): boolean => {
  const date = new Date(dateString);
  return date.getDay() === 0 || date.getDay() === 6;
};

// Helper function to format dates
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });
};

export default function TimeSheetForm({ timesheetId }: TimeSheetFormProps) {
  // State for user, timesheet period, and data
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [timesheet, setTimesheet] = useState<Timesheet | null>(null);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [phases, setPhases] = useState<StandardPhase[]>([]);
  const [dates, setDates] = useState<Date[]>([]);
  const [showAddProject, setShowAddProject] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [selectedPhase, setSelectedPhase] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Load user data and timesheet on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error('User not authenticated');
        }
        setUser(user);
        
        // Get timesheet data
        const { data: timesheetData, error: timesheetError } = await supabase
          .from('timesheets')
          .select('*')
          .eq('id', timesheetId)
          .single();
          
        if (timesheetError) {
          throw timesheetError;
        }
        
        setTimesheet(timesheetData);
        
        // Generate array of dates for the period
        const start = new Date(timesheetData.period_start);
        const end = new Date(timesheetData.period_end);
        const datesArray = [];
        const currentDate = new Date(start);
        
        while (currentDate <= end) {
          datesArray.push(new Date(currentDate));
          currentDate.setDate(currentDate.getDate() + 1);
        }
        
        setDates(datesArray);
        
        // Fetch time entries
        await fetchTimeEntries(timesheetId);
      } catch (err: any) {
        console.error('Error fetching timesheet data:', err);
        setError(err.message);
      }
    };
    
    fetchData();
  }, [timesheetId]);

  // Fetch projects and phases
  useEffect(() => {
    const fetchProjectsAndPhases = async () => {
      try {
        // Fetch projects
        const { data: projectsData, error: projectsError } = await supabase
          .from('projects')
          .select('*')
          .eq('is_active', true)
          .order('project_number');
          
        if (projectsError) {
          throw projectsError;
        }
        
        setProjects(projectsData || []);
        
        // Fetch phases
        const { data: phasesData, error: phasesError } = await supabase
          .from('standard_phases')
          .select('*')
          .eq('is_active', true)
          .order('display_order');
          
        if (phasesError) {
          throw phasesError;
        }
        
        setPhases(phasesData || []);
      } catch (err: any) {
        console.error('Error fetching projects and phases:', err);
        setError(err.message);
      }
    };
    
    fetchProjectsAndPhases();
  }, []);

  // Fetch time entries for a timesheet
  const fetchTimeEntries = async (timesheetId: string) => {
    try {
      const { data: entries, error } = await supabase
        .from('time_entries')
        .select(`
          *,
          projects:project_id (id, project_number, name),
          phases:phase_id (id, phase_code, name)
        `)
        .eq('timesheet_id', timesheetId);
        
      if (error) {
        throw error;
      }
      
      setTimeEntries(entries || []);
    } catch (err: any) {
      console.error('Error fetching time entries:', err);
      setError(err.message);
    }
  };

  // Add a new project-phase combination to the timesheet
  const addProjectPhase = async () => {
    if (!selectedProject || !selectedPhase) {
      setStatusMessage('Please select both a project and a phase');
      return;
    }
    
    // Check if this project-phase combo already exists in the timesheet
    const exists = timeEntries.some(entry => 
      entry.project_id === selectedProject && entry.phase_id === selectedPhase
    );
    
    if (exists) {
      setStatusMessage('This project and phase combination already exists in your timesheet');
      return;
    }
    
    try {
      setSaving(true);
      setStatusMessage('Adding project...');
      
      // Add empty time entries for each day in the period
      const newEntries = dates.map(date => ({
        timesheet_id: timesheetId,
        project_id: selectedProject,
        phase_id: selectedPhase,
        date: date.toISOString().split('T')[0],
        hours: 0,
        description: ''
      }));
      
      const { error } = await supabase
        .from('time_entries')
        .insert(newEntries);
        
      if (error) {
        throw error;
      }
      
      setStatusMessage('Project added successfully');
      await fetchTimeEntries(timesheetId);
      setShowAddProject(false);
      setSelectedProject(null);
      setSelectedPhase(null);
    } catch (err: any) {
      console.error('Error adding time entries:', err);
      setStatusMessage(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Update a time entry value
  const updateTimeEntry = async (entryId: string, hours: string) => {
    try {
      // Validate hours input
      const numHours = parseFloat(hours);
      if (isNaN(numHours) || numHours < 0 || numHours > 24) {
        setStatusMessage('Hours must be between 0 and 24');
        return;
      }
      
      const { error } = await supabase
        .from('time_entries')
        .update({ hours: numHours })
        .eq('id', entryId);
        
      if (error) {
        throw error;
      }
      
      setStatusMessage('Entry updated');
      
      // Update local state
      setTimeEntries(timeEntries.map(entry => 
        entry.id === entryId ? { ...entry, hours: numHours } : entry
      ));
    } catch (err: any) {
      console.error('Error updating time entry:', err);
      setStatusMessage(`Error: ${err.message}`);
    }
  };

  // Submit timesheet for review
  const submitTimesheet = async () => {
    try {
      setSaving(true);
      setStatusMessage('Submitting timesheet...');
      
      // Calculate total hours
      const totalHours = timeEntries.reduce((sum, entry) => sum + (parseFloat(entry.hours.toString()) || 0), 0);
      
      // Update timesheet status
      const { error } = await supabase
        .from('timesheets')
        .update({ 
          status: 'submitted',
          total_hours: totalHours,
          submitted_at: new Date().toISOString()
        })
        .eq('id', timesheetId);
        
      if (error) {
        throw error;
      }
      
      setStatusMessage('Timesheet submitted for review');
      // Update local state
      if (timesheet) {
        setTimesheet({
          ...timesheet,
          status: 'submitted',
          total_hours: totalHours,
          submitted_at: new Date().toISOString()
        });
      }
      
      // Redirect to list after a short delay
      setTimeout(() => {
        router.push('/timesheets');
      }, 1500);
    } catch (err: any) {
      console.error('Error submitting timesheet:', err);
      setStatusMessage(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Save timesheet as draft
  const saveDraft = async () => {
    try {
      setSaving(true);
      setStatusMessage('Saving draft...');
      
      // Calculate total hours
      const totalHours = timeEntries.reduce((sum, entry) => sum + (parseFloat(entry.hours.toString()) || 0), 0);
      
      // Update timesheet
      const { error } = await supabase
        .from('timesheets')
        .update({ 
          total_hours: totalHours,
        })
        .eq('id', timesheetId);
        
      if (error) {
        throw error;
      }
      
      setStatusMessage('Draft saved successfully');
      // Update local state
      if (timesheet) {
        setTimesheet({
          ...timesheet,
          total_hours: totalHours
        });
      }
    } catch (err: any) {
      console.error('Error saving draft:', err);
      setStatusMessage(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Group time entries by project and phase
  const groupTimeEntries = (): GroupedTimeEntries => {
    const grouped: GroupedTimeEntries = {};
    
    timeEntries.forEach(entry => {
      if (entry.project_id && entry.phase_id && entry.projects && entry.phases) {
        const key = `${entry.project_id}-${entry.phase_id}`;
        if (!grouped[key]) {
          grouped[key] = {
            project: entry.projects,
            phase: entry.phases,
            entries: {}
          };
        }
        grouped[key].entries[entry.date] = entry;
      }
    });
    
    return grouped;
  };

  const groupedEntries = groupTimeEntries();

  // If not loaded yet, show loading state
  if (!timesheet || !dates.length) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading timesheet...</p>
        </div>
      </div>
    );
  }

  // If timesheet is already submitted or approved, show read-only view
  const isReadOnly = timesheet.status !== 'draft';

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-blue-600 text-white flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">Timesheet</h1>
            <div className="flex items-center gap-2 mt-1">
              <Calendar size={16} />
              <span>
                {new Date(timesheet.period_start).toLocaleDateString()} - {new Date(timesheet.period_end).toLocaleDateString()}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="font-semibold">{user?.email}</div>
            <div className="text-sm text-blue-100">
              {timesheet.status === 'draft' ? 'Draft' : 
               timesheet.status === 'submitted' ? 'Submitted' : 
               timesheet.status === 'approved' ? 'Approved' : 'Rejected'}
            </div>
          </div>
        </div>
        
        {/* Status message */}
        {statusMessage && (
          <div className="px-6 py-2 bg-blue-50 border-b border-blue-100 text-blue-700 text-sm">
            {statusMessage}
          </div>
        )}
        
        {/* Error message */}
        {error && (
          <div className="px-6 py-2 bg-red-50 border-b border-red-100 text-red-700 text-sm flex items-center">
            <AlertCircle size={16} className="mr-2" />
            {error}
          </div>
        )}
        
        {/* Read-only notice */}
        {isReadOnly && (
          <div className="px-6 py-3 bg-yellow-50 border-b border-yellow-100 text-yellow-700">
            This timesheet has been {timesheet.status} and cannot be edited.
          </div>
        )}
        
        {/* Timesheet table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100 border-b">
                <th className="px-4 py-3 text-left font-semibold w-24">Project #</th>
                <th className="px-4 py-3 text-left font-semibold">Project Name</th>
                <th className="px-4 py-3 text-left font-semibold">Phase</th>
                {dates.map(date => (
                  <th 
                    key={date.toISOString()} 
                    className={`px-2 py-3 text-center font-semibold w-16 ${isWeekend(date.toISOString()) ? 'bg-gray-200' : ''}`}
                  >
                    {formatDate(date.toISOString())}
                  </th>
                ))}
                <th className="px-4 py-3 text-center font-semibold w-20">Total</th>
              </tr>
            </thead>
            <tbody>
              {Object.values(groupedEntries).map((group, groupIndex) => {
                // Calculate row total
                const rowTotal = Object.values(group.entries).reduce(
                  (sum, entry) => sum + (parseFloat(entry.hours.toString()) || 0), 
                  0
                );
                
                return (
                  <tr 
                    key={groupIndex} 
                    className="border-b hover:bg-blue-50"
                  >
                    <td className="px-4 py-3 align-middle">{group.project.project_number}</td>
                    <td className="px-4 py-3 align-middle">{group.project.name}</td>
                    <td className="px-4 py-3 align-middle">
                      <span className="inline-flex items-center">
                        <span className="text-xs font-medium bg-blue-100 text-blue-800 px-2 py-0.5 rounded mr-2">
                          {group.phase.phase_code}
                        </span>
                        {group.phase.name}
                      </span>
                    </td>
                    
                    {dates.map(date => {
                      const dateStr = date.toISOString().split('T')[0];
                      const entry = group.entries[dateStr];
                      
                      return (
                        <td 
                          key={date.toISOString()} 
                          className={`px-1 py-2 text-center ${isWeekend(dateStr) ? 'bg-gray-100' : ''}`}
                        >
                          {isReadOnly ? (
                            <span>{entry?.hours || '—'}</span>
                          ) : (
                            <input
                              type="number"
                              min="0"
                              max="24"
                              step="0.25"
                              value={entry?.hours || ''}
                              onChange={(e) => updateTimeEntry(entry.id, e.target.value)}
                              className="w-14 p-1 text-center border rounded"
                            />
                          )}
                        </td>
                      );
                    })}
                    
                    <td className="px-4 py-3 text-center font-semibold">
                      {rowTotal.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
              
              {/* Add project row - only show if draft status */}
              {!isReadOnly && (
                <tr className="border-b bg-gray-50">
                  <td colSpan={3 + dates.length + 1} className="px-4 py-3">
                    {showAddProject ? (
                      <div className="flex flex-wrap items-center gap-4">
                        <div className="w-64">
                          <label className="block text-xs text-gray-500 mb-1">Project</label>
                          <div className="relative">
                            <select 
                              className="w-full p-2 pr-8 border rounded appearance-none bg-white"
                              value={selectedProject || ''}
                              onChange={(e) => setSelectedProject(e.target.value || null)}
                            >
                              <option value="">Select a project</option>
                              {projects.map(project => (
                                <option key={project.id} value={project.id}>
                                  {project.project_number} - {project.name}
                                </option>
                              ))}
                            </select>
                            <ChevronDown size={16} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
                          </div>
                        </div>
                        
                        <div className="w-64">
                          <label className="block text-xs text-gray-500 mb-1">Phase</label>
                          <div className="relative">
                            <select 
                              className="w-full p-2 pr-8 border rounded appearance-none bg-white"
                              value={selectedPhase || ''}
                              onChange={(e) => setSelectedPhase(e.target.value || null)}
                            >
                              <option value="">Select a phase</option>
                              {phases.map(phase => (
                                <option key={phase.id} value={phase.id}>
                                  {phase.phase_code} - {phase.name}
                                </option>
                              ))}
                            </select>
                            <ChevronDown size={16} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
                          </div>
                        </div>
                        
                        <div className="flex gap-2 mt-4">
                          <button
                            onClick={addProjectPhase}
                            disabled={saving}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded flex items-center gap-1"
                          >
                            <Plus size={16} />
                            Add
                          </button>
                          
                          <button
                            onClick={() => setShowAddProject(false)}
                            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )

: (
                      <button
                        onClick={() => setShowAddProject(true)}
                        className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded flex items-center gap-1"
                      >
                        <Plus size={16} />
                        Add Project
                      </button>
                    )}
                  </td>
                </tr>
              )}
              
              {/* Totals row */}
              <tr className="border-b bg-gray-100 font-semibold">
                <td colSpan={3} className="px-4 py-3 text-right">
                  Daily Totals
                </td>
                
                {dates.map(date => {
                  const dateStr = date.toISOString().split('T')[0];
                  
                  // Calculate total for this date
                  const dayTotal = timeEntries
                    .filter(entry => entry.date === dateStr)
                    .reduce((sum, entry) => sum + (parseFloat(entry.hours.toString()) || 0), 0);
                  
                  return (
                    <td 
                      key={date.toISOString()} 
                      className={`px-2 py-3 text-center ${isWeekend(dateStr) ? 'bg-gray-200' : ''}`}
                    >
                      {dayTotal > 0 ? dayTotal.toFixed(2) : '—'}
                    </td>
                  );
                })}
                
                {/* Grand total */}
                <td className="px-4 py-3 text-center bg-blue-100">
                  {timeEntries.reduce((sum, entry) => sum + (parseFloat(entry.hours.toString()) || 0), 0).toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        {/* Footer actions */}
        <div className="px-6 py-4 bg-gray-50 border-t flex justify-between items-center">
          <div>
            {!isReadOnly && (
              <button
                onClick={saveDraft}
                disabled={saving}
                className="px-4 py-2 bg-white border hover:bg-gray-50 text-gray-600 rounded flex items-center gap-1"
              >
                <Save size={16} />
                Save Draft
              </button>
            )}
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => router.push('/timesheets')}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded"
            >
              Back to List
            </button>
            
            {!isReadOnly && (
              <button
                onClick={submitTimesheet}
                disabled={saving}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded flex items-center gap-2"
              >
                <Send size={16} />
                Submit for Review
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}