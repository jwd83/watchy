import { spawn } from 'child_process'

class VLCService {
  sanitizeInput(input) {
    // Some API responses may accidentally pass an object (e.g. { link: "..." })
    // which would become "[object Object]" on the command line.
    let value = input

    if (value && typeof value === 'object') {
      if (typeof value.link === 'string') value = value.link
      else if (typeof value.l === 'string') value = value.l
      else value = String(value)
    }

    if (typeof value !== 'string') value = String(value ?? '')

    value = value.trim()

    // Guard against HTML-escaped ampersands which break query strings.
    value = value.replaceAll('&amp;', '&')

    // Only normalize URLs (do NOT encode local file paths).
    if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(value)) {
      try {
        value = encodeURI(value)
      } catch {
        // ignore encoding errors; keep original
      }
    }

    return value
  }

  play(input) {
    const url = this.sanitizeInput(input)
    console.log('Opening VLC with URL:', url)

    let command = 'vlc'
    const args = ['--fullscreen', '--no-video-title-show', url]

    if (process.platform === 'darwin') {
      command = '/Applications/VLC.app/Contents/MacOS/VLC'
    } else if (process.platform === 'win32') {
      command = 'C:\\Program Files\\VideoLAN\\VLC\\vlc.exe'
    }

    const vlcProcess = spawn(command, args, {
      detached: true,
      stdio: 'ignore'
    })

    vlcProcess.on('error', (err) => {
      console.error('Failed to start VLC:', err)
    })

    // Let Electron continue even if VLC is still running.
    vlcProcess.unref()
  }
}

export default new VLCService()
