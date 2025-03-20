import { useState } from 'react';
import viteLogo from '/vite.svg';
import reactLogo from './assets/react.svg';
import Header from './Header';
import CreateAccountForm from './CreateAccountForm';

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <Header />
      <div className="main-content">
        <div>
          <a href="https://vite.dev" target="_blank">
            <img src={viteLogo} className="logo" alt="Vite logo" />
          </a>
          <a href="https://react.dev" target="_blank">
            <img src={reactLogo} className="logo react" alt="React logo" />
          </a>
        </div>
        <h1>Vite + React + Solana Devnet</h1>
        <div className="card">
          <button onClick={() => setCount((count) => count + 1)}>
            count is {count}
          </button>
          <p>Edit <code>src/App.tsx</code> and save to test HMR</p>
        </div>
        <p className="read-the-docs">Click logos to learn more</p>
        <CreateAccountForm />
      </div>
    </>
  );
}

export default App;