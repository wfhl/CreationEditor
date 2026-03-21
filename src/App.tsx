import {
    Download, Film,
    Image as ImageIcon,
    Loader2,
    Redo2, Scissors, Sparkles, Type, Undo2,
    PenTool, Edit2, Play, Scroll, Settings, Archive, Folder,
} from 'lucide-react';
import { useState } from 'react';
import MediaBin from './components/MediaBin';
import Player from './components/Player';
import PropertiesPanel from './components/PropertiesPanel';
import SubtitleEditor from './components/SubtitleEditor';
import Timeline from './components/Timeline';
import TransitionsBin from './components/TransitionsBin';
import './index.css';
import { TimelineProvider, useTimelineContext } from './lib/TimelineContext';
import { SidebarTab } from './lib/types';
import SimpleCreator from './creator/components/SimpleCreator';
import { generateUUID } from './creator/lib/uuid';

/* ─── Creator tab IDs that render the full-screen creator view ─── */
const CREATOR_TABS: SidebarTab[] = ['creator-create', 'creator-refine', 'creator-script', 'creator-animate', 'creator-assets', 'creator-settings'];

/* ─── Sidebar icon rail (like Clipchamp left bar) ─── */
const EDITOR_TABS: { id: SidebarTab; icon: React.ReactNode; label: string }[] = [
  { id: 'media', icon: <Film size={20} />, label: 'Your media' },
  { id: 'text', icon: <Type size={20} />, label: 'Text' },
  { id: 'transitions', icon: <Sparkles size={20} />, label: 'Transitions' },
  { id: 'filters', icon: <ImageIcon size={20} />, label: 'Filters' },
];

const STUDIO_TABS: { id: SidebarTab; icon: React.ReactNode; label: string }[] = [
  { id: 'creator-create', icon: <PenTool size={20} />, label: 'Create' },
  { id: 'creator-refine', icon: <Edit2 size={20} />, label: 'Refine' },
  { id: 'creator-script', icon: <Scroll size={20} />, label: 'Script' },
  { id: 'creator-animate', icon: <Play size={20} />, label: 'Animate' },
];

const SETTINGS_TAB: { id: SidebarTab; icon: React.ReactNode; label: string } = {
  id: 'creator-settings',
  icon: <Settings size={20} />,
  label: 'Settings'
};

function SidebarRail() {
  const { state, setSidebarTab, toggleSidebar } = useTimelineContext();

  const renderTab = (tab: typeof EDITOR_TABS[0]) => (
    <button
      key={tab.id}
      className={`rail-btn ${state.sidebarTab === tab.id && state.sidebarOpen ? 'active' : ''}`}
      onClick={() =>
        state.sidebarTab === tab.id && state.sidebarOpen ? toggleSidebar() : setSidebarTab(tab.id)
      }
      title={tab.label}
    >
      {tab.icon}
      <span className="rail-label">{tab.label}</span>
    </button>
  );

  return (
    <nav className="sidebar-rail">
      <div className="rail-section">
        <div className="rail-section-label">Studio</div>
        {STUDIO_TABS.map(renderTab)}
      </div>

      <div className="rail-divider" />

      <div className="rail-section">
        <div className="rail-section-label">Editor</div>
        {EDITOR_TABS.map(renderTab)}
      </div>

      <div className="spacer" style={{ flex: 1 }} />

      <div className="rail-section bottom">
        {renderTab(SETTINGS_TAB)}
      </div>
    </nav>
  );
}

/* ─── Sidebar panel content ─── */

function SidebarPanel() {
  const { state } = useTimelineContext();
  if (!state.sidebarOpen) return null;

  return (
    <aside className="sidebar-panel">
      {state.sidebarTab === 'media' && <MediaBin />}
      {state.sidebarTab === 'text' && <SubtitleEditor />}
      {state.sidebarTab === 'transitions' && <TransitionsBin />}
      {state.sidebarTab === 'filters' && (
        <div className="sidebar-placeholder">
          <ImageIcon size={32} opacity={0.2} />
          <h3>Filters &amp; Effects</h3>
          <p>Apply color grading and visual effects.</p>
          <span className="coming-soon-badge">Coming soon</span>
        </div>
      )}
    </aside>
  );
}

/* ─── App Header ─── */

function AppHeader() {
  const { state, setProjectName, undo, redo, canUndo, canRedo } = useTimelineContext();
  const [exporting, setExporting] = useState(false);
  const [editingName, setEditingName] = useState(false);

  const handleExport = async () => {
    const exportPath = await window.electronAPI.showExportDialog();
    if (!exportPath) return;
    setExporting(true);
    try {
      const result = await window.electronAPI.exportVideo(state, exportPath);
      if (result.success) {
        alert(`Exported successfully to ${result.path}`);
      } else {
        alert(`Export failed: ${result.error}`);
      }
    } catch (e: any) {
      alert(`Export error: ${e.message}`);
    }
    setExporting(false);
  };

  const isCreatorTab = CREATOR_TABS.includes(state.sidebarTab);

  return (
    <header className="app-header">
      <div className="header-left">
        <div className="brand">
          <Scissors size={20} strokeWidth={2.5} />
          <span>ClipVid</span>
        </div>
        <div className="header-divider" />
        {editingName ? (
          <input
            className="project-name-input"
            value={state.projectName}
            onChange={e => setProjectName(e.target.value)}
            onBlur={() => setEditingName(false)}
            onKeyDown={e => e.key === 'Enter' && setEditingName(false)}
            autoFocus
          />
        ) : (
          <button className="project-name-btn" onClick={() => setEditingName(true)}>
            {state.projectName}
          </button>
        )}
      </div>

      <div className="header-center">
        {!isCreatorTab && (
          <>
            <button className="header-icon-btn" onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)">
              <Undo2 size={18} />
            </button>
            <button className="header-icon-btn" onClick={redo} disabled={!canRedo} title="Redo (Ctrl+Y)">
              <Redo2 size={18} />
            </button>
          </>
        )}
      </div>

      <div className="header-right">
        {!isCreatorTab && (
          <button
            className="btn-primary"
            onClick={handleExport}
            disabled={exporting}
          >
            {exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            {exporting ? 'Exporting...' : 'Export'}
          </button>
        )}
      </div>
    </header>
  );
}

/* ─── Main content layout ─── */

function AppContent() {
  const { state, setSidebarTab, addMediaToLibrary } = useTimelineContext();

  const isCreatorTab = CREATOR_TABS.includes(state.sidebarTab);

  const selectedClip = state.selectedClipId
    ? (() => { for (const t of state.tracks) { const c = t.clips.find(c => c.id === state.selectedClipId); if (c) return c; } return null; })()
    : null;
  const hasTransitionSelection = !!state.selectedTransitionClipId;

  const getVideoDuration = (url: string): Promise<number> =>
    new Promise((resolve) => {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.onloadedmetadata = () => resolve(isFinite(video.duration) ? video.duration : 6);
        video.onerror = () => resolve(6);
        video.src = url;
    });

  const handleSendToEditor = (urls: string[]) => {
    urls.forEach(async (url, index) => {
        const isUrlVideo = url.startsWith('data:video') || (() => {
            const clean = url.split('?')[0].split('#')[0].toLowerCase();
            return ['.mp4', '.mov', '.webm', '.m4v', '.ogv'].some(ext => clean.endsWith(ext));
        })();

        const duration = isUrlVideo ? await getVideoDuration(url) : 0;
        const mediaType = isUrlVideo ? 'Video' : 'Image';
        const timestamp = new Date().toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        addMediaToLibrary({
            id: generateUUID(),
            name: urls.length > 1 ? `${mediaType} ${index + 1} – ${timestamp}` : `${mediaType} – ${timestamp}`,
            type: isUrlVideo ? 'video' : 'image',
            path: url,
            duration,
        });
    });
  };

  return (
    <div className="app-container">
      <AppHeader />
      <div className="app-body">
        <SidebarRail />

        {/* ─── Full-screen creator canvas ─── Always mounted to preserve state */}
        <div style={{ flex: 1, overflow: 'hidden', position: 'relative', display: isCreatorTab ? 'flex' : 'none', flexDirection: 'column' }}>
          <SimpleCreator
              externalTab={state.sidebarTab.replace('creator-', '') as any}
              onSendToEditor={handleSendToEditor}
              onNavigateTo={(tab) => {
                const target = tab.startsWith('creator-') ? tab : `creator-${tab}`;
                setSidebarTab(target as SidebarTab);
              }}
          />
        </div>

        {/* ─── Normal editor layout ─── */}
        {!isCreatorTab && (
          <>
            <SidebarPanel />
            <main className="app-main">
              <Player />
            </main>
            {(selectedClip || hasTransitionSelection) && <PropertiesPanel />}
          </>
        )}
      </div>
      {!isCreatorTab && <Timeline />}
    </div>
  );
}

function App() {
  return (
    <TimelineProvider>
      <AppContent />
    </TimelineProvider>
  );
}

export default App;
