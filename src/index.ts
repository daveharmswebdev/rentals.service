import { app, PORT } from './app';

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default server;
