import { spawn } from 'child_process'
import { existsSync } from 'fs'

class VLCService {
  sanitizeInput(input) {
    let value = input

    if (value && typeof value === 'object') {
      if (typeof value.link === 'string') value = value.link
      else if (typeof value.l === 'string') value = value.l
      else value = String(value)
    }

    if (typeof value !== 'string') value = String(value ?? '')

    value = value.trim()
    value = value.replaceAll('&amp;', '&')

    if (value.includes('%3A') || value.includes('%2F')) {
      try {
        value = decodeURIComponent(value)
      } catch {
        // ignore decode errors
      }
    }

    return value
  }

  // A missing VLC only shows up as an async spawn error, so `play` resolves once the
  // process is actually running and rejects otherwise. Callers surface the failure.
  play(input, subtitleUrl = null, options = {}) {
    const url = this.sanitizeInput(input)
    let command = 'vlc'
    const args = ['--fullscreen', '--no-video-title-show']

    if (options.enableEnglishSubtitles) {
      args.push('--sub-language=eng,en,English')
    }

    if (subtitleUrl) {
      args.push(`--input-slave=${this.sanitizeInput(subtitleUrl)}`)
    }

    args.push(url)

    if (process.platform === 'darwin') {
      command = '/Applications/VLC.app/Contents/MacOS/VLC'
    } else if (process.platform === 'win32') {
      const candidates = [
        'C:\\Program Files\\VideoLAN\\VLC\\vlc.exe',
        'C:\\Program Files (x86)\\VideoLAN\\VLC\\vlc.exe'
      ]
      const found = candidates.find((p) => existsSync(p))
      if (found) command = found
    }

    return new Promise((resolve, reject) => {
      const vlcProcess = spawn(command, args, {
        detached: true,
        stdio: 'ignore'
      })

      vlcProcess.once('error', (err) => {
        console.error('Failed to start VLC:', err)
        reject(new Error(this.launchErrorMessage(err, command)))
      })

      vlcProcess.once('spawn', () => {
        // Let Electron continue even if VLC is still running.
        vlcProcess.unref()
        resolve()
      })
    })
  }

  launchErrorMessage(err, command) {
    if (err?.code === 'ENOENT') {
      return command === 'vlc'
        ? 'VLC not found. Install VLC Media Player to play this.'
        : `VLC not found at ${command}. Install VLC Media Player to play this.`
    }

    return `Unable to start VLC: ${err?.message || 'unknown error'}`
  }
}

export default new VLCService()
