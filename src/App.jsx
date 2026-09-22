import { useState } from 'react';
import { Navbar } from './components/Navbar';
import { SocialBar } from './components/SocialBar';
import { Loader } from './components/Loader';
import { Hero } from './components/Hero';
import { About } from './components/About';
import { Projects } from './components/Projects';
import { Skills } from './components/Skills';
import { Publications } from './components/Publications';
import { Contact } from './components/Contact';

function App() {
  const [loaded, setLoaded] = useState(false);

  return (
    <>
      <Loader onDone={() => setLoaded(true)} />

      {/* Fixed chrome — only show after loader */}
      {loaded && (
        <>
          <Navbar />
          <SocialBar />
        </>
      )}

      {/* Page content */}
      <main style={{ width: '100%', opacity: loaded ? 1 : 0, transition: 'opacity 0.5s' }}>
        <Hero />
        <About />
        <Projects />
        <Skills />
        <Publications />
        <Contact />
      </main>
    </>
  );
}

export default App;
