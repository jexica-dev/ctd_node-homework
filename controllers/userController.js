if (!global.users) {
  global.users = [];
}

const register = (req, res) => {
  const { name, email, password } = req.body;

  const newUser = {
    id: Date.now().toString(),
    name,
    email,
    password,
  };

  global.users.push(newUser);
  global.user_id = newUser;

  return res.status(201).json({
    name: newUser.name,
    email: newUser.email,
  });
};

const logon = (req, res) => {
  const { email, password } = req.body;

  const user = global.users.find(
    (u) => u.email === email && u.password === password,
  );

  if (user) {
    global.user_id = user;
    return res.status(200).json({
      name: user.name,
      email: user.email,
    });
  }

  return res.status(401).json({ error: 'Invalid credentials' });
};

const logoff = (req, res) => {
  global.user_id = null;
  return res.status(200).json({ message: 'Successfully logged off' });
};

module.exports = {
  register,
  logon,
  logoff,
};
