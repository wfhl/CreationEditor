import shutil, os

base = '/Users/gypsyadmin/Library/Mobile Documents/com~apple~CloudDocs/VIBECODING/clipvid-main'
src = base + '/character-video-creator-app/src'
dest = base + '/src/creator'

os.makedirs(dest + '/lib', exist_ok=True)
os.makedirs(dest + '/components/tabs', exist_ok=True)

lib_files = [
    'dbService.ts','falService.ts','geminiService.ts','imageUtils.ts',
    'migrationService.ts','supabaseClient.ts','syncService.ts','uuid.ts',
    'migration_v2.sql','migration_v3.sql'
]
for f in lib_files:
    shutil.copy(src + '/lib/' + f, dest + '/lib/' + f)
    print('copied lib/' + f)

comp_files = [
    'asset-uploader.tsx','creator-presets.ts',
    'image-with-loader.tsx','loading-indicator.tsx'
]
for f in comp_files:
    shutil.copy(src + '/components/' + f, dest + '/components/' + f)
    print('copied components/' + f)

tab_files = [
    'AnimateTab.tsx','AssetLibraryTab.tsx','CreateTab.tsx','CreatorHeader.tsx',
    'EditTab.tsx','PostsTab.tsx','PresetsDropdown.tsx','ScriptsTab.tsx','SettingsTab.tsx'
]
for f in tab_files:
    shutil.copy(src + '/components/tabs/' + f, dest + '/components/tabs/' + f)
    print('copied tabs/' + f)

shutil.copy(src + '/components/simple-creator.tsx', dest + '/simple-creator.tsx')
print('copied simple-creator.tsx')
print('ALL DONE')
