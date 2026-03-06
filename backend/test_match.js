async function test() {
  
  const createUser = async (username, name) => {
    await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email: username+'@test.com', password: 'password', name, jobTitle: 'Tester' })
    });
    const res = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password: 'password' })
    });
    const data = await res.json();
    return data.user;
  };

  const matchUser = async (userId, lat, lon) => {
    const res = await fetch('http://localhost:5000/api/match', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, lat, lon })
    });
    return await res.json();
  };

  console.log('Testing Stateless Matchmaker...');
  try {
    const u1 = await createUser('alice123', 'Alice');
    const u2 = await createUser('bob123', 'Bob');

    console.log('Created users:', u1._id, u2._id);

    console.log('Alice starts matching...');
    const p1 = matchUser(u1._id, 40.0, -74.0);
    
    await new Promise(r => setTimeout(r, 1000));

    console.log('Bob starts matching...');
    const p2 = matchUser(u2._id, 40.0, -74.0);

    const [res1, res2] = await Promise.all([p1, p2]);
    
    console.log('Alice Match Result:', res1);
    console.log('Bob Match Result:', res2);
  } catch (err) {
    console.error('Test Failed:', err);
  }
}

test();
