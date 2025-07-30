import React, { useState } from 'react';
import { MoreVertical, ChevronDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

function renderDropdown(label, open, setOpen, items, selected, setSelected) {
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="text-sm border rounded px-3 py-1.5 bg-white min-w-[140px] flex justify-between items-center"
        title={label}
        aria-label={label}
      >
        {selected || label}
        <ChevronDown className="w-4 h-4 ml-2" />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 w-full bg-white border rounded shadow">
          {items.map((item) => (
            <div
              key={item}
              onClick={() => {
                setSelected(item);
                setOpen(false);
              }}
              className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 ${
                selected === item ? 'bg-gray-100 font-medium' : ''
              }`}
            >
              {item}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const AdminProjects = () => {
  // State declarations (unique, no duplicates)
  // State declarations (all at the top, before any logic)
  const [searchClientText, setSearchClientText] = useState('');
  const [searchTeam, setSearchTeam] = useState('');
  const [searchProject, setSearchProject] = useState('');
  const [teamDropdownOpen, setTeamDropdownOpen] = useState(false);
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [clientDropdownOpen, setClientDropdownOpen] = useState(false);
  const [newClientInput, setNewClientInput] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [color, setColor] = useState('#2b9e8d');
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  // Employees state (id, name)
  const [employees, setEmployees] = useState<{ id: string; name: string }[]>([]);
  const [teamOptionsLoading, setTeamOptionsLoading] = useState(true);
  const [projectOptions, setProjectOptions] = useState([]);
  const presetColors = ['#2b9e8d', '#f44336', '#4caf50', '#2196f3', '#ff9800'];
  // Timesheet state for selected employee
  const [employeeTimesheet, setEmployeeTimesheet] = useState<any>(null);
  const [loadingTimesheet, setLoadingTimesheet] = useState(false);
  // Fetch timesheet when employee changes
  React.useEffect(() => {
    if (!searchTeam) {
      setEmployeeTimesheet(null);
      return;
    }
    setLoadingTimesheet(true);
    // Find employee ID from name
    const empObj = employees.find(e => e.name === searchTeam);
    const empId = empObj ? empObj.id : '';
    if (!empId) {
      setEmployeeTimesheet(null);
      setLoadingTimesheet(false);
      return;
    }
    const EMPLOYEE_API_URL = 'https://script.google.com/macros/s/AKfycbxeKUf-9LFaMvH8tBa9jGuTMz5_h1Uk9N85cjtdNeyl1xLn16bDZqBZZPHonj-6Ba94_w/exec';
    const url = `${EMPLOYEE_API_URL}?type=timesheet&empId=${encodeURIComponent(empId)}`;
    // Debug log
    console.log('Fetching timesheet for empId:', empId, 'URL:', url);
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        setEmployeeTimesheet(data);
        setLoadingTimesheet(false);
        console.log('Fetched timesheet for employee:', empId, data);
      })
      .catch(() => {
        setEmployeeTimesheet(null);
        setLoadingTimesheet(false);
      });
  }, [searchTeam, employees]);
  // Add new client to dropdown
  const handleAddNewClient = () => {
    if (newClientInput.trim() && !clients.includes(newClientInput.trim())) {
      setClients([...clients, newClientInput.trim()]);
      setSelectedClient(newClientInput.trim());
      setClientDropdownOpen(false);
      setNewClientInput('');
    }
  };
  // ...existing code...

  const handleClearFilters = () => {
    setSearchTeam('');
    setSearchClientText('');
    setSearchProject('');
    setProjectOptions([]);
    fetchProjects(undefined);
  };

  const filteredProjects = projects.filter(
    (project) => {
      // If employee is selected, filter by timesheet projects
      if (searchTeam && employeeTimesheet && employeeTimesheet.columns && employeeTimesheet.rows) {
        // Find all project names in timesheet rows
        const timesheetProjects = new Set();
        employeeTimesheet.rows.forEach(row => {
          row.forEach(cell => {
            if (cell && typeof cell === 'string') {
              // Each cell may contain multiple entries separated by '||'
              const entries = cell.split('||');
              entries.forEach(entry => {
                const parts = entry.split('|');
                if (parts.length > 0 && parts[0].trim()) {
                  timesheetProjects.add(parts[0].trim());
                }
              });
            }
          });
        });
        if (!timesheetProjects.has(project.name)) return false;
      }
      return (
        (!searchClientText || project.client.toLowerCase().includes(searchClientText.toLowerCase())) &&
        (!searchProject || project.status === searchProject)
      );
    }
  );

  // Fetch projects from Apps Script backend
  const fetchProjects = async (team) => {
    setLoading(true);
    try {
      let url = 'https://script.google.com/macros/s/AKfycbwWy9JiCu0WPRQjDyEe5tG6LrdQSxIYkLPJS94bsOJsQwRovMz24oADW9SaY3EddjwT/exec?action=list';
      if (team) {
        url += `&team=${encodeURIComponent(team)}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      setProjects(data);
      setProjectOptions(data.map(function(proj) { return proj.name; }));
    } catch (err) {
      // handle error
    }
    setLoading(false);
  }


  // Fetch employee details from Apps Script (same as AdminTimesheet)
  React.useEffect(() => {
    setTeamOptionsLoading(true);
    fetch('https://script.google.com/macros/s/AKfycbxeKUf-9LFaMvH8tBa9jGuTMz5_h1Uk9N85cjtdNeyl1xLn16bDZqBZZPHonj-6Ba94_w/exec?type=employeeList')
      .then((res) => res.json())
      .then((data) => {
        setEmployees(Array.isArray(data) ? data : []);
        setTeamOptionsLoading(false);
      })
      .catch(() => {
        setEmployees([]);
        setTeamOptionsLoading(false);
      });
  }, []);

  // When team changes, fetch projects for that team
  React.useEffect(() => {
    if (searchTeam) {
      fetchProjects(searchTeam);
    } else {
      fetchProjects(undefined);
    }
  }, [searchTeam]);

  // Create new project
  const handleCreateProject = async () => {
    if (!projectName || !selectedClient) return;
    setLoading(true);
    await fetch('https://script.google.com/macros/s/AKfycbwWy9JiCu0WPRQjDyEe5tG6LrdQSxIYkLPJS94bsOJsQwRovMz24oADW9SaY3EddjwT/exec', {
      method: 'POST',
      body: new URLSearchParams({
        action: 'create',
        name: projectName,
        client: selectedClient,
        access: isPublic ? 'Public' : 'Private',
      }),
    });
    setIsCreateModalOpen(false);
    setProjectName('');
    setSelectedClient('');
    setIsPublic(true);
    fetchProjects(undefined);
    setLoading(false);
  };

  // Delete project
  const handleDeleteProject = async (id: number) => {
    setLoading(true);
    await fetch('https://script.google.com/macros/s/AKfycbwWy9JiCu0WPRQjDyEe5tG6LrdQSxIYkLPJS94bsOJsQwRovMz24oADW9SaY3EddjwT/exec', {
      method: 'POST',
      body: new URLSearchParams({
        action: 'delete',
        id: id.toString(),
      }),
    });
    fetchProjects(undefined);
    setLoading(false);
  };

  // Mark project as complete
  const handleCompleteProject = async (id: number) => {
    setLoading(true);
    await fetch('https://script.google.com/macros/s/AKfycbwWy9JiCu0WPRQjDyEe5tG6LrdQSxIYkLPJS94bsOJsQwRovMz24oADW9SaY3EddjwT/exec', {
      method: 'POST',
      body: new URLSearchParams({
        action: 'complete',
        id: id.toString(),
      }),
    });
    fetchProjects(undefined);
    setLoading(false);
  };

  const renderDropdown = (
    label: string,
    open: boolean,
    setOpen: React.Dispatch<React.SetStateAction<boolean>>,
    items: string[],
    selected: string,
    setSelected: React.Dispatch<React.SetStateAction<string>>
  ) => (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="text-sm border rounded px-3 py-1.5 bg-white min-w-[140px] flex justify-between items-center"
        title={label}
        aria-label={label}
      >
        {selected || label}
        <ChevronDown className="w-4 h-4 ml-2" />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 w-full bg-white border rounded shadow">
          {items.map((item) => (
            <div
              key={item}
              onClick={() => {
                setSelected(item);
                setOpen(false);
              }}
              className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 ${
                selected === item ? 'bg-gray-100 font-medium' : ''
              }`}
            >
              {item}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Projects</h1>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium"
        >
          Create New Project
        </button>
      </div>

      {/* Filter Row */}
      <div className="bg-white p-3 rounded-lg shadow mt-3 w-full flex flex-wrap justify-between items-center gap-3 relative z-10">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm text-gray-600 font-medium">FILTER</span>
          {/* Employee Dropdown: fetch and display employee names (AdminTimesheet style) */}
          {teamOptionsLoading ? (
            <div className="text-sm px-3 py-1.5 text-gray-400">Loading employees...</div>
          ) : (
            <div className="relative">
              <button
                onClick={() => setTeamDropdownOpen(!teamDropdownOpen)}
                className="text-sm border rounded px-3 py-1.5 bg-white min-w-[180px] flex justify-between items-center"
                title="Employee"
                aria-label="Employee"
              >
                {searchTeam || 'Select Employee'}
                <ChevronDown className="w-4 h-4 ml-2" />
              </button>
              {teamDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 z-50 w-full bg-white border rounded shadow max-h-60 overflow-auto">
                  {employees.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-gray-400">No employees found.</div>
                  ) : (
                    employees.map((emp) => (
                      <div
                        key={emp.id}
                        onClick={() => {
                          setSearchTeam(emp.name);
                          setTeamDropdownOpen(false);
                        }}
                        className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 ${searchTeam === emp.name ? 'bg-gray-100 font-medium' : ''}`}
                      >
                        {emp.name}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
          {renderDropdown('Status', projectDropdownOpen, setProjectDropdownOpen, ['Active', 'Completed'], searchProject, setSearchProject)}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="text"
            placeholder="Search Client"
            value={searchClientText}
            onChange={(e) => setSearchClientText(e.target.value)}
            className="text-sm border rounded px-3 py-1.5 min-w-[440px]"
          />
          {/* Removed APPLY FILTER button as requested */}
          <Button variant="outline" className="text-sm px-4 py-1.5" onClick={handleClearFilters}>
            CLEAR FILTERS
          </Button>
        </div>
      </div>

      {/* Project Cards Grid */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {loadingTimesheet ? (
          <div className="col-span-full text-center py-6 text-blue-500 flex flex-col items-center">
            <svg className="animate-spin h-6 w-6 mb-2 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
            Fetching employee timesheet...
          </div>
        ) : loading ? (
          <div className="col-span-full text-center py-6 text-gray-500">Loading...</div>
        ) : filteredProjects.length === 0 ? (
          <div className="col-span-full text-center py-6 text-gray-500">No projects found.</div>
        ) : (
          filteredProjects.map((project) => (
            <div key={project.id} className="bg-white rounded-xl shadow-md border p-5 flex flex-col justify-between hover:shadow-lg transition">
              <div className="flex items-center gap-3 mb-3">
                {project.imageUrl ? (
                  <img src={project.imageUrl} alt={project.name} className="w-12 h-12 rounded object-cover border" />
                ) : (
                  <div
                    className="w-12 h-12 rounded flex items-center justify-center font-bold text-xl border"
                    style={{ backgroundColor: project.color || '#e5e7eb', color: '#fff' }}
                  >
                    {project.name[0]}
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-bold text-gray-800">{project.name}</h3>
                  <div className="text-xs text-gray-500">{project.client || '--'}</div>
                </div>
              </div>
              <div className="flex flex-col gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-600">Access:</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${project.access === 'Public' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{project.access}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-600">Status:</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${project.status === 'Completed' ? 'bg-gray-200 text-gray-500' : 'bg-blue-100 text-blue-700'}`}>{project.status || 'Active'}</span>
                </div>
              </div>
              <div className="flex gap-2 justify-end mt-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteProject(project.id)}
                  title="Delete Project"
                  className="text-xs px-3 py-1"
                >Delete</Button>
                {project.status !== 'Completed' && (
                  <Button
                    variant="success"
                    size="sm"
                    onClick={() => handleCompleteProject(project.id)}
                    title="Mark as Complete"
                    className="text-xs px-3 py-1"
                  >Mark Complete</Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Project Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-[90%] max-w-xl p-6 relative">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-black"
              onClick={() => setIsCreateModalOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Create new Project</h2>

            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Enter Project name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="border rounded px-3 py-2 text-sm"
              />

              {/* Custom searchable client dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setClientDropdownOpen(!clientDropdownOpen)}
                  className="border rounded px-3 py-2 text-sm w-full text-left flex justify-between items-center"
                >
                  {selectedClient || 'Select client'}
                  <ChevronDown className="w-4 h-4 ml-2" />
                </button>

                {clientDropdownOpen && (
                  <div className="absolute z-50 mt-1 w-full bg-white border rounded shadow-lg max-h-60 overflow-auto">
                    <div className="p-2 border-b">
                      <input
                        type="text"
                        placeholder="Search or add client"
                        value={newClientInput}
                        onChange={(e) => setNewClientInput(e.target.value)}
                        className="w-full border rounded px-2 py-1 text-sm"
                      />
                    </div>

                    {/* Get all unique clients from projects list and default array */}
                    {Array.from(new Set([...clients, ...projects.map(p => p.client)]))
                      .filter((client) =>
                        client.toLowerCase().includes(newClientInput.toLowerCase())
                      )
                      .map((client) => (
                        <div
                          key={client}
                          onClick={() => {
                            setSelectedClient(client);
                            setClientDropdownOpen(false);
                            setNewClientInput('');
                          }}
                          className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-100"
                        >
                          {client}
                        </div>
                      ))}

                    {newClientInput &&
                      !clients.includes(newClientInput) &&
                      newClientInput.trim().length > 0 && (
                        <div
                          onClick={handleAddNewClient}
                          className="px-3 py-2 text-sm cursor-pointer text-green-600 hover:bg-green-50 border-t"
                        >
                          ➕ Add "{newClientInput}"
                        </div>
                      )}
                  </div>
                )}
              </div>

              {/* Color Palette */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  {presetColors.map((preset) => (
                    <button
                      key={preset}
                      className={`w-7 h-7 rounded-full border-2 ${
                        color === preset ? 'border-black' : 'border-white'
                      }`}
                      style={{ backgroundColor: preset }}
                      onClick={() => setColor(preset)}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-10 h-10 rounded border"
                  />
                  <span className="text-sm text-gray-600">Custom Color</span>
                </div>
              </div>

              {/* Access dropdown */}
              <div className="flex flex-col text-sm">
                <label className="mb-1 font-medium text-gray-700">Access</label>
                <select
                  value={isPublic ? 'Public' : 'Private'}
                  onChange={(e) => setIsPublic(e.target.value === 'Public')}
                  className="border rounded px-3 py-1 text-sm w-full h-9"
                >
                  <option value="Public">Public</option>
                  <option value="Private">Private</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-4">
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-green-600 text-sm hover:underline"
              >
                Cancel
              </button>
              <button
                className="bg-green-600 hover:bg-green-700 text-white text-sm px-6 py-2 rounded"
                onClick={handleCreateProject}
                disabled={loading}
              >
                {loading ? 'Creating...' : 'CREATE'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ...existing code...
// Place the full AdminProjects component here
// ...existing code...
export default AdminProjects;