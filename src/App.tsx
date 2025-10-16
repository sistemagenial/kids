
import { BrowserRouter } from 'react-router-dom';
import { useRoutes } from 'react-router-dom';
import routes from './router/config';
import { ToastProvider } from './contexts/ToastContext';
import './index.css';

function AppRoutes() {
  const element = useRoutes(routes);
  return element;
}

function App() {
  return (
    <BrowserRouter basename={__BASE_PATH__}>
      <ToastProvider>
        <div className="App">
          <AppRoutes />
        </div>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;