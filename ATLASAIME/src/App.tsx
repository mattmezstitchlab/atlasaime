import { useEffect, useState } from 'react';
import type { CollectionId, Project } from './types';
import { StartScreen } from './components/start/StartScreen';
import { Editor } from './components/editor/Editor';
import { Visionneuse } from './components/viewer/Visionneuse';
import { DesignSystems } from './components/viewer/DesignSystems';
import { DocumentDesk } from './components/start/DocumentDesk';
import { decodeProject, loadProjects, removeProject, saveProject, useGithubRepos } from './hooks/useAtlas';
import { COLLECTIONS } from './data/repos';
import { createProject, uid } from './data/templates';
import { buildStitchProject, decodeAssemblage, resolveAssembly, type LinkBand, type Section } from './data/stitch';
import { AssemblageView } from './components/start/AssemblageView';
import { ErrorBoundary } from './components/ErrorBoundary';

function readShared(): Project | null {
  const m = window.location.hash.match(/#lecture=([A-Za-z0-9_-]+)/);
  return m ? decodeProject(m[1]) : null;
}

const clearHash = () => window.history.replaceState(null, '', window.location.pathname + window.location.search);

export function App() {
  const github = useGithubRepos();
  const [recent, setRecent] = useState<Project[]>(() => loadProjects());
  const [shared, setShared] = useState<Project | null>(() => readShared());
  const [current, setCurrent] = useState<Project | null>(null);
  const [screen, setScreen] = useState<'home' | 'viewer' | 'systems' | 'desk'>('home');
  const [systemId, setSystemId] = useState<string | null>(null);
  const [assembly, setAssembly] = useState<{ domain: CollectionId; picks: Section[]; links?: LinkBand[] } | null>(null);

  useEffect(() => {
    const onHash = () => setShared(readShared());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    const apply = () => {
      const m = window.location.hash.match(/#assemblage=([A-Za-z0-9_-]+)/);
      if (!m) {
        setAssembly(null);
        return;
      }
      const dec = decodeAssemblage(m[1]);
      if (!dec) {
        setAssembly(null);
        return;
      }
      const res = dec.picks ? { domain: dec.domain, picks: dec.picks, links: dec.links } : resolveAssembly(dec.ids, github.repos);
      setAssembly(res ? { ...res, domain: dec.domain } : null);
    };
    apply();
    window.addEventListener('hashchange', apply);
    return () => window.removeEventListener('hashchange', apply);
  }, [github.repos]);

  useEffect(() => {
    document.title =
      screen === 'viewer' ? 'Visionneuse — ATLAS' : screen === 'systems' ? 'Design systems — ATLAS' : screen === 'desk' ? 'Bureau AIME — ATLAS' : current ? `${current.name} — ATLAS` : shared ? `${shared.name} · lecture seule — ATLAS` : 'ATLAS — Mémoire active';
  }, [current, shared, screen]);

  const duplicate = (p: Project): Project => {
    const now = Date.now();
    const copy: Project = { ...structuredClone(p), id: uid('p'), name: `${p.name} (copie)`, createdAt: now, updatedAt: now };
    setRecent(saveProject(copy));
    return copy;
  };

  if (shared) {
    return (
      <Editor
        key={`lecture-${shared.id}-${shared.updatedAt}`}
        initialProject={shared}
        github={github}
        projectsCount={recent.length}
        readOnly
        onExit={() => {
          clearHash();
          setShared(null);
        }}
        onSaved={() => {}}
        onDuplicate={(p) => {
          const copy = duplicate(p);
          clearHash();
          setShared(null);
          setCurrent(copy);
        }}
      />
    );
  }

  if (screen === 'viewer') {
    return (
      <Visionneuse
        repos={github.repos}
        projects={recent}
        onBack={() => { setCurrent(null); setScreen('home'); }}
        onOpenSystems={(id) => {
          setSystemId(id ?? null);
          setScreen('systems');
        }}
        onOpenDesk={() => setScreen('desk')}
        onCompose={(ids) => {
          const p = createProject({
            name: 'Grille infinie',
            typeId: 'archive',
            layoutId: 'infinite',
            supportId: 'desktop',
            explicit: ids,
            repos: github.repos,
          });
          setRecent(saveProject(p));
          setCurrent(p);
          setScreen('home');
        }}
      />
    );
  }

  if (screen === 'systems') {
    return <DesignSystems repos={github.repos} initialId={systemId} onBack={() => { setCurrent(null); setScreen('home'); }} onOpenViewer={() => setScreen('viewer')} onOpenDesk={() => setScreen('desk')} />;
  }

  if (screen === 'desk') {
    return <DocumentDesk onBack={() => { setCurrent(null); setScreen('home'); }} onOpenViewer={() => setScreen('viewer')} onOpenSystems={() => { setSystemId(null); setScreen('systems'); }} />;
  }

  if (current) {
    return (
      <ErrorBoundary
        key={`boundary-${current.id}`}
        label={`éditeur · ${current.name}`}
        onReset={() => {
          setCurrent(null);
          setRecent(loadProjects());
          setScreen('home');
        }}
      >
      <Editor
        key={current.id}
        initialProject={current}
        github={github}
        projectsCount={recent.length}
        onExit={() => {
          setCurrent(null);
          setRecent(loadProjects());
        }}
        onSaved={(p) => {
          setCurrent(p);
          setRecent((list) => [p, ...list.filter((x) => x.id !== p.id)]);
        }}
        onDuplicate={(p) => setCurrent(duplicate(p))}
        onOpenViewer={() => setScreen('viewer')}
        onOpenDesk={() => setScreen('desk')}
        onOpenSystems={() => {
          setSystemId(null);
          setScreen('systems');
        }}
      />
      </ErrorBoundary>
    );
  }

  return (
    <>
      <StartScreen
        github={github}
        recent={recent}
        onRestored={setRecent}
        onOpen={setCurrent}
        onCreate={(p) => {
          setRecent(saveProject(p));
          setCurrent(p);
        }}
        onDelete={(id) => setRecent(removeProject(id))}
        onDuplicate={(p) => {
          duplicate(p);
        }}
        onOpenViewer={() => setScreen('viewer')}
        onOpenSystems={() => {
          setSystemId(null);
          setScreen('systems');
        }}
        onOpenDesk={() => setScreen('desk')}
      />
      {assembly && (
        <AssemblageView
          picks={assembly.picks}
          links={assembly.links}
          domain={assembly.domain}
          onClose={() => {
            history.replaceState(null, '', window.location.pathname);
            setAssembly(null);
          }}
          onOpenEditor={() => {
            const domainLabel = COLLECTIONS.find((c) => c.id === assembly.domain)?.label ?? assembly.domain;
            const p = buildStitchProject(`Assemblage partagé · ${domainLabel}`, assembly.picks, github.repos, assembly.links);
            setRecent(saveProject(p));
            setCurrent(p);
            setAssembly(null);
          }}
        />
      )}
    </>
  );
}

export default App;
