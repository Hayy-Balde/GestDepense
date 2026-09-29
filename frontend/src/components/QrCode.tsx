import { useEffect, useState } from "react"
import QRCode from "qrcode"
import { Loader2 } from "lucide-react"

interface QrCodeProps {
  value: string
  size?: number
  className?: string
}

export function QrCode({ value, size = 192, className }: QrCodeProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    QRCode.toDataURL(value, {
      width: size,
      margin: 2,
      color: { dark: "#0f172a", light: "#ffffff" },
    })
      .then((url) => {
        if (!cancelled) setDataUrl(url)
      })
      .catch(() => {
        if (!cancelled) setDataUrl(null)
      })

    return () => {
      cancelled = true
    }
  }, [value, size])

  if (!dataUrl) {
    return (
      <div
        className={`flex items-center justify-center rounded-xl border border-[var(--border)] bg-white ${className ?? ""}`}
        style={{ width: size, height: size }}
        aria-label="Génération du QR code…"
      >
        <Loader2 className="w-6 h-6 animate-spin text-[var(--muted-foreground)]" />
      </div>
    )
  }

  return <img src={dataUrl} alt="QR Code" className={className} style={{ width: size, height: size }} />
}
