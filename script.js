const API_BASE = 'http://localhost:3000';

const taskInput = document.getElementById('taskInput');
const hoursInput = document.getElementById('hoursInput');
const addButton = document.getElementById('addButton');
const logsList = document.getElementById('logsList');

addButton.addEventListener('click', addWorkLog);

async function addWorkLog() {
  const task = taskInput.value.trim();
  const hours = parseFloat(hoursInput.value);

  if (!task || isNaN(hours) || hours <= 0) {
    alert('Please enter a valid task and positive hours');
    return;
  }

  try {
   
    const response = await fetch(`${API_BASE}/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ task, hours })
    });

    if (!response.ok) {
      throw new Error('Failed to add work log');
    }

    taskInput.value = '';
    hoursInput.value = '';

    loadWorkLogs();
  } catch (error) {
    console.error('Error adding work log:', error);
    alert('Error adding work log. Please try again.');
  }
}

async function loadWorkLogs() {
  try {
   
    const response = await fetch(`${API_BASE}/logs`);

    if (!response.ok) {
      throw new Error('Failed to fetch work logs');
    }

    const logs = await response.json();

    logsList.innerHTML = '';

    if (logs.length === 0) {
      logsList.innerHTML = '<li>No work logs yet</li>';
    } else {
      logs.forEach(log => {
        const li = document.createElement('li');
        const date = new Date(log.date).toLocaleDateString();
        li.textContent = `${date} - ${log.task} - ${log.hours} hours`;
        logsList.appendChild(li);
      });
    }
  } catch (error) {
    console.error('Error loading work logs:', error);
    logsList.innerHTML = '<li>Error loading work logs</li>';
  }
}

document.addEventListener('DOMContentLoaded', loadWorkLogs);
