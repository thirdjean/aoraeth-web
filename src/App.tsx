import React, { useState, useMemo, useEffect } from 'react';
import { SanctuaryMap } from './components/SanctuaryMap';

function App() {
  return (
    <div className="w-full h-screen overflow-hidden">
      <SanctuaryMap />
    </div>
  );
}

export default App;
