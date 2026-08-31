const http = require('http');

const baseURL = 'http://localhost:5000/api';

async function fetchAPI(endpoint, method = 'GET', body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${baseURL}${endpoint}`);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          if (data) {
            resolve({ status: res.statusCode, data: JSON.parse(data) });
          } else {
             resolve({ status: res.statusCode, data: null });
          }
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (e) => reject(e));

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runHealthCheck() {
  console.log('--- STARTING HEALTH CHECK ---');
  let token = null;

  try {
    // 1. Register User
    console.log('1. Registering user...');
    const email = `testuser_${Date.now()}@example.com`;
    const regRes = await fetchAPI('/auth/register', 'POST', {
      name: 'Test User',
      email: email,
      password: 'password123'
    });
    console.log(`Register status: ${regRes.status}`);
    if (regRes.status !== 201) throw new Error(JSON.stringify(regRes.data));
    token = regRes.data.token;
    
    // 2. Fetch Profile
    console.log('2. Fetching profile...');
    const profRes = await fetchAPI('/profile', 'GET', null, token);
    console.log(`Profile status: ${profRes.status}`);
    if (profRes.status !== 200) throw new Error(JSON.stringify(profRes.data));

    // 3. Create Project
    console.log('3. Creating project...');
    const projRes = await fetchAPI('/projects', 'POST', {
      name: 'Test Project',
      description: 'A test project for health checks'
    }, token);
    console.log(`Create project status: ${projRes.status}`);
    if (projRes.status !== 201) throw new Error(JSON.stringify(projRes.data));
    const projectId = projRes.data.id;

    // 4. Create Task
    console.log('4. Creating task...');
    const taskRes = await fetchAPI('/tasks', 'POST', {
      project_id: projectId,
      title: 'Test Task',
      description: 'Check local time insertion',
      status: 'todo',
      priority: 'high'
    }, token);
    console.log(`Create task status: ${taskRes.status}`);
    if (taskRes.status !== 201) throw new Error(JSON.stringify(taskRes.data));
    const taskId = taskRes.data.id;
    console.log(`Task created_at timestamp: ${taskRes.data.created_at}`);

    // 5. Add Comment
    console.log('5. Adding comment...');
    const commRes = await fetchAPI(`/tasks/${taskId}/comments`, 'POST', {
      content: 'Looks good'
    }, token);
    console.log(`Add comment status: ${commRes.status}`);
    if (commRes.status !== 201) throw new Error(JSON.stringify(commRes.data));
    console.log(`Comment created_at timestamp: ${commRes.data.created_at}`);

    // 6. Add Team Member
    console.log('6. Adding team member...');
    const teamRes = await fetchAPI('/team', 'POST', {
      name: 'John Doe',
      email: 'john.doe@example.com',
      role: 'Developer'
    }, token);
    console.log(`Add team member status: ${teamRes.status}`);
    if (teamRes.status !== 201) throw new Error(JSON.stringify(teamRes.data));

    // 7. Get Analytics
    console.log('7. Fetching analytics...');
    const statRes = await fetchAPI('/analytics', 'GET', null, token);
    console.log(`Analytics status: ${statRes.status}`);
    if (statRes.status !== 200) throw new Error(JSON.stringify(statRes.data));
    console.log(`Total projects: ${statRes.data.total_projects}, Total tasks: ${statRes.data.total_tasks}`);

    console.log('--- HEALTH CHECK PASSED ---');
  } catch (err) {
    console.error('--- HEALTH CHECK FAILED ---');
    console.error(err);
  }
}

runHealthCheck();
