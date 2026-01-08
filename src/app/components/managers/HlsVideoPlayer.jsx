import React, { useEffect, useRef } from 'react'
import Hls from 'hls.js'

export default function HlsVideoPlayer({ src, poster, ...props }) {
  const videoRef = useRef(null)

  useEffect(() => {
    if (videoRef.current && src && src.endsWith('.m3u8')) {
      if (Hls.isSupported()) {
        const hls = new Hls()
        hls.loadSource(src)
        hls.attachMedia(videoRef.current)
        return () => {
          hls.destroy()
        }
      } else if (
        videoRef.current.canPlayType('application/vnd.apple.mpegurl')
      ) {
        videoRef.current.src = src
      }
    }
  }, [src])

  return (
    <video
      ref={videoRef}
      poster={poster}
      controls
      style={{ width: '100%', maxHeight: 400, background: '#111' }}
      {...props}
    />
  )
}
