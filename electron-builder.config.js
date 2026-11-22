// Configurazione installer Windows + aggiornamenti da GitHub Releases.
// Su GitHub Actions il nome del repository viene preso in automatico (GITHUB_REPOSITORY = "utente/repo").
const pkg = require('./package.json');
const fromEnv = (process.env.GITHUB_REPOSITORY || '').split('/');
const fromPkg = ((pkg.repository && (pkg.repository.url || pkg.repository)) || '').replace(/^.*github\.com[/:]/, '').replace(/\.git$/, '').split('/');
const owner = fromEnv[0] || fromPkg[0] || 'IMPOSTA-UTENTE-GITHUB';
const repo = fromEnv[1] || fromPkg[1] || 'colors-led-studio';

module.exports = {
  appId: 'com.colorstowear.ledstudio',
  productName: 'Colors LED Studio',
  copyright: 'Colors to Wear',
  files: ['index.html', 'main.js', 'preload.js', 'build/icon.ico'],
  directories: { output: 'dist', buildResources: 'build' },
  win: { target: [{ target: 'nsis', arch: ['x64'] }], icon: 'build/icon.ico' },
  nsis: {
    oneClick: false,
    perMachine: false,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: 'Colors LED Studio',
    runAfterFinish: true,
    installerIcon: 'build/icon.ico',
    uninstallerIcon: 'build/icon.ico',
    installerLanguages: ['it_IT'],
    language: '1040',
    artifactName: 'ColorsLEDStudio-Setup-${version}.${ext}'
  },
  publish: [{ provider: 'github', owner, repo, releaseType: 'release' }]
};
