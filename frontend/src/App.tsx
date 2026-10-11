import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HeaderHomePage from './Components/header.tsx';
import { NotFoundPage } from './Pages/PageNotFound.tsx';

function App() {
  return (
    <BrowserRouter>
      <HeaderHomePage />
      <Routes>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
