import { spawn } from 'child_process'

class VLCService {
  play(url) {
    console.log('Opening VLC with URL:', url)
    // Try to find VLC in standard locations or just use 'vlc' command
    const vlcCommand = 'vlc'
    // On macOS, it might be /Applications/VLC.app/Contents/MacOS/VLC
    // We can try to detect or just assume 'vlc' is in PATH or use the full path.
    // For a robust app, we'd check OS.

    let command = 'vlc'
    let args = [url]

    if (process.platform === 'darwin') {
      command = '/Applications/VLC.app/Contents/MacOS/VLC'
    } else if (process.platform === 'win32') {
      command = 'C:\\Program Files\\VideoLAN\\VLC\\vlc.exe'
    }

    const vlcProcess = spawn(command, args)

    vlcProcess.on('error', (err) => {
      console.error('Failed to start VLC:', err)
    })

    vlcProcess.on('close', (code) => {
      console.log(`VLC process exited with code ${code}`)
    })
  }
}

export default new VLCService()
