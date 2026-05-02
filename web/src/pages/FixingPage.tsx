

export default function FixingPage() {

    return (
            <div style={{
      minHeight: '100vh',
      display: 'flex',
      background: 'var(--bg)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background decoration */}
      <div style={{
        position: 'absolute',
        top: -200,
        right: -200,
        width: 600,
        height: 600,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(108,99,255,0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        bottom: -100,
        left: -100,
        width: 400,
        height: 400,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(34,211,165,0.07) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
 
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
        }}>
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '80px',
            maxWidth: 520,
        }}></div>
        {/* SEU BLOCO AQUI */}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                padding: '80px',
                maxWidth: 520,
            }}>
                <div style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 800,
                fontSize: 42,
                lineHeight: 1,
                marginBottom: 24,
                color: 'var(--text)',
                letterSpacing: '-1.5px',
                }}>
                flash<span style={{ color: 'var(--accent)' }}>.</span>
                </div>
                <p style={{ fontSize: 18, color: 'var(--text-muted)', lineHeight: 1.7, maxWidth: 340 }}>
                Estamos resolvendo problemas técnicos para melhorar sua experiência. Volte em breve!
                </p>
        
                <div style={{ marginTop: 56, display: 'flex', flexDirection: 'column', gap: 20 }}>
                {[
                    { icon: '◎', title: 'Importar em .csv', desc: 'Utilize o formato CSV para importar seus flashcards' },
                    { icon: '▦', title: 'Importar em .apkg', desc: 'Utilize o formato ANKI para importar seu flashcards' },
                    { icon: '↗', title: 'Modelos de importação', desc: 'Escolha como vai fazer a importação | decks, folders' },
                ].map(({ icon, title, desc }) => (
                    <div key={title} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                    <div style={{
                        width: 36, height: 36,
                        borderRadius: 10,
                        background: 'var(--accent-soft)',
                        border: '1px solid var(--accent-border)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 14, color: 'var(--accent)', flexShrink: 0,
                    }}>{icon}</div>
                    <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{title}</div>
                        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{desc}</div>
                    </div>
                    </div>
                ))}
                </div>
            </div>
        </div>
    </div>

    )
}