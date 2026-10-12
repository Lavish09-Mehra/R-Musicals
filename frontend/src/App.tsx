import { BrowserRouter, Routes, Route } from 'react-router-dom';

import { NotFoundPage } from './Pages/PageNotFound.tsx';
import HomePage from './Pages/homepage.tsx';
import { ECommerce } from './Pages/e_comm.tsx';
function App() {
  return (
    <BrowserRouter>
      
      <Routes>
        <Route path='/' element={<HomePage />} />
        <Route path='/products' element={<ECommerce />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
