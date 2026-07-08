import {
  cloneElement,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactElement,
} from 'react'
import styles from './EditorLayout.module.css'

type Slot = ReactElement<{ className?: string }>
type PanelKey = 'command' | 'files' | 'console' | 'logs' | 'help'
type TopSideKey = 'files' | 'help'
type BottomPanelKey = 'logs' | 'command' | 'console'

type EditorLayoutProps = {
  titleBar: Slot
  files: Slot
  editor: Slot
  usefulCommands: Slot
  logs: Slot
  command: Slot
  console: Slot
}

const TABS: ReadonlyArray<{ key: PanelKey; label: string }> = [
  { key: 'command', label: 'Commande' },
  { key: 'files', label: 'Fichiers' },
  { key: 'console', label: 'Console' },
  { key: 'logs', label: 'Logs' },
  { key: 'help', label: 'Commandes utiles' },
]

const BOTTOM_PANELS: ReadonlyArray<BottomPanelKey> = ['logs', 'command', 'console']

const MIN_BOTTOM_HEIGHT = 120
const MAX_BOTTOM_HEIGHT = 480
const MIN_TOP_SIDE_WIDTH = 150
const MAX_TOP_SIDE_WIDTH = 460
const MIN_BOTTOM_PANEL_WIDTH = 150
const MAX_BOTTOM_PANEL_WIDTH = 460
const RESIZE_STEP = 20
const GRID_GAP = 8
const HANDLE_CENTER_OFFSET = GRID_GAP / 2

type BottomSizes = Record<BottomPanelKey, number>

type HeightResizeStart = {
  y: number
  height: number
}

type TopResizeStart = {
  type: 'top'
  side: TopSideKey
  x: number
  width: number
}

type BottomResizeStart = {
  type: 'bottom'
  left: BottomPanelKey
  right: BottomPanelKey
  rightIsLast: boolean
  x: number
  sizes: BottomSizes
}

type HorizontalResizeStart = TopResizeStart | BottomResizeStart

function place(node: Slot, gridClass: string, hidden = false): Slot {
  const merged = [node.props.className, gridClass, hidden ? styles.hidden : '']
    .filter(Boolean)
    .join(' ')
  return cloneElement(node, { className: merged })
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function clampBottomHeight(height: number) {
  const maxFromWindow = typeof window === 'undefined'
    ? MAX_BOTTOM_HEIGHT
    : Math.max(MIN_BOTTOM_HEIGHT, window.innerHeight - 180)
  const maxHeight = Math.min(MAX_BOTTOM_HEIGHT, maxFromWindow)
  return clamp(height, MIN_BOTTOM_HEIGHT, maxHeight)
}

function fixedColumn(width: number, minWidth = MIN_BOTTOM_PANEL_WIDTH) {
  return `minmax(${minWidth}px, ${width}px)`
}

function flexibleColumn(minWidth = MIN_BOTTOM_PANEL_WIDTH) {
  return `minmax(${minWidth}px, 1fr)`
}

function resizeBottomPanels(
  sizes: BottomSizes,
  left: BottomPanelKey,
  right: BottomPanelKey,
  rightIsLast: boolean,
  delta: number,
) {
  const next = { ...sizes }

  if (rightIsLast) {
    next[left] = clamp(
      sizes[left] + delta,
      MIN_BOTTOM_PANEL_WIDTH,
      MAX_BOTTOM_PANEL_WIDTH,
    )
    return next
  }

  const nextLeft = clamp(
    sizes[left] + delta,
    MIN_BOTTOM_PANEL_WIDTH,
    MAX_BOTTOM_PANEL_WIDTH,
  )
  const usedDelta = nextLeft - sizes[left]
  const nextRight = clamp(
    sizes[right] - usedDelta,
    MIN_BOTTOM_PANEL_WIDTH,
    MAX_BOTTOM_PANEL_WIDTH,
  )
  const finalDelta = sizes[right] - nextRight

  next[left] = clamp(
    sizes[left] + finalDelta,
    MIN_BOTTOM_PANEL_WIDTH,
    MAX_BOTTOM_PANEL_WIDTH,
  )
  next[right] = nextRight
  return next
}

function EditorLayout({
  titleBar,
  files,
  editor,
  usefulCommands,
  logs,
  command,
  console,
}: EditorLayoutProps) {
  const [panel, setPanel] = useState<PanelKey>('command')
  const [hiddenPanels, setHiddenPanels] = useState<Record<PanelKey, boolean>>({
    command: false,
    files: false,
    console: false,
    logs: false,
    help: false,
  })
  const [bottomHeight, setBottomHeight] = useState(200)
  const [topSizes, setTopSizes] = useState<Record<TopSideKey, number>>({
    files: 220,
    help: 280,
  })
  const [bottomSizes, setBottomSizes] = useState<BottomSizes>({
    logs: 260,
    command: 260,
    console: 360,
  })

  const heightResizeStart = useRef<HeightResizeStart | null>(null)
  const horizontalResizeStart = useRef<HorizontalResizeStart | null>(null)

  const visibleTabs = useMemo(
    () => TABS.filter((tab) => !hiddenPanels[tab.key]),
    [hiddenPanels],
  )

  const visibleBottomPanels = useMemo(
    () => BOTTOM_PANELS.filter((key) => !hiddenPanels[key]),
    [hiddenPanels],
  )

  const hasBottomPanel = visibleBottomPanels.length > 0

  const topColumns = [
    hiddenPanels.files ? null : fixedColumn(topSizes.files, MIN_TOP_SIDE_WIDTH),
    flexibleColumn(260),
    hiddenPanels.help ? null : fixedColumn(topSizes.help, MIN_TOP_SIDE_WIDTH),
  ]
    .filter(Boolean)
    .join(' ')

  const bottomColumns = visibleBottomPanels
    .map((key, index) => {
      const isLast = index === visibleBottomPanels.length - 1
      return isLast ? flexibleColumn() : fixedColumn(bottomSizes[key])
    })
    .join(' ')

  function firstVisiblePanel(nextHiddenPanels: Record<PanelKey, boolean>) {
    return TABS.find((tab) => !nextHiddenPanels[tab.key])?.key ?? 'command'
  }

  function togglePanel(key: PanelKey) {
    const nextHiddenPanels = {
      ...hiddenPanels,
      [key]: !hiddenPanels[key],
    }

    setHiddenPanels(nextHiddenPanels)
    if (nextHiddenPanels[panel]) {
      setPanel(firstVisiblePanel(nextHiddenPanels))
    }
  }

  function startHeightResize(event: ReactPointerEvent<HTMLDivElement>) {
    event.preventDefault()
    heightResizeStart.current = { y: event.clientY, height: bottomHeight }
    document.body.style.cursor = 'row-resize'
    document.body.style.userSelect = 'none'
  }

  function startTopResize(
    event: ReactPointerEvent<HTMLDivElement>,
    side: TopSideKey,
  ) {
    event.preventDefault()
    horizontalResizeStart.current = {
      type: 'top',
      side,
      x: event.clientX,
      width: topSizes[side],
    }
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }

  function startBottomResize(
    event: ReactPointerEvent<HTMLDivElement>,
    left: BottomPanelKey,
    right: BottomPanelKey,
    rightIsLast: boolean,
  ) {
    event.preventDefault()
    horizontalResizeStart.current = {
      type: 'bottom',
      left,
      right,
      rightIsLast,
      x: event.clientX,
      sizes: bottomSizes,
    }
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }

  function resizeHeightWithKeyboard(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setBottomHeight((height) => clampBottomHeight(height + RESIZE_STEP))
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setBottomHeight((height) => clampBottomHeight(height - RESIZE_STEP))
    }
  }

  function resizeTopWithKeyboard(
    event: KeyboardEvent<HTMLDivElement>,
    side: TopSideKey,
  ) {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') {
      return
    }

    event.preventDefault()
    const delta = event.key === 'ArrowRight' ? RESIZE_STEP : -RESIZE_STEP

    setTopSizes((sizes) => ({
      ...sizes,
      [side]: clamp(
        side === 'files' ? sizes[side] + delta : sizes[side] - delta,
        MIN_TOP_SIDE_WIDTH,
        MAX_TOP_SIDE_WIDTH,
      ),
    }))
  }

  function resizeBottomWithKeyboard(
    event: KeyboardEvent<HTMLDivElement>,
    left: BottomPanelKey,
    right: BottomPanelKey,
    rightIsLast: boolean,
  ) {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') {
      return
    }

    event.preventDefault()
    const delta = event.key === 'ArrowRight' ? RESIZE_STEP : -RESIZE_STEP
    setBottomSizes((sizes) => resizeBottomPanels(sizes, left, right, rightIsLast, delta))
  }

  function renderTopResizeHandle(side: TopSideKey) {
    const label = side === 'files'
      ? 'Redimensionner les fichiers et le code'
      : 'Redimensionner le code et les commandes utiles'
    const position = side === 'files'
      ? { left: `${topSizes.files + HANDLE_CENTER_OFFSET}px` }
      : { right: `${topSizes.help + HANDLE_CENTER_OFFSET}px` }

    return (
      <div
        className={styles.verticalResizeHandle}
        style={position}
        role="separator"
        aria-label={label}
        aria-orientation="vertical"
        aria-valuemin={MIN_TOP_SIDE_WIDTH}
        aria-valuemax={MAX_TOP_SIDE_WIDTH}
        aria-valuenow={topSizes[side]}
        aria-valuetext={`${topSizes[side]} pixels`}
        tabIndex={0}
        title={label}
        onPointerDown={(event) => startTopResize(event, side)}
        onKeyDown={(event) => resizeTopWithKeyboard(event, side)}
      >
        <span className={styles.verticalResizeIcon}>↔</span>
      </div>
    )
  }

  function bottomHandleLeft(index: number) {
    let left = 0

    for (let i = 0; i <= index; i += 1) {
      left += bottomSizes[visibleBottomPanels[i]]
    }

    return left + (index * GRID_GAP) + HANDLE_CENTER_OFFSET
  }

  function renderBottomResizeHandle(index: number) {
    const left = visibleBottomPanels[index]
    const right = visibleBottomPanels[index + 1]
    const rightIsLast = index + 1 === visibleBottomPanels.length - 1

    return (
      <div
        key={`resize-${left}`}
        className={styles.verticalResizeHandle}
        style={{ left: `${bottomHandleLeft(index)}px` }}
        role="separator"
        aria-label="Redimensionner les panneaux du bas"
        aria-orientation="vertical"
        aria-valuemin={MIN_BOTTOM_PANEL_WIDTH}
        aria-valuemax={MAX_BOTTOM_PANEL_WIDTH}
        aria-valuenow={bottomSizes[left]}
        aria-valuetext={`${bottomSizes[left]} pixels`}
        tabIndex={0}
        title="Redimensionner les panneaux du bas"
        onPointerDown={(event) => startBottomResize(event, left, right, rightIsLast)}
        onKeyDown={(event) => resizeBottomWithKeyboard(event, left, right, rightIsLast)}
      >
        <span className={styles.verticalResizeIcon}>↔</span>
      </div>
    )
  }

  useEffect(() => {
    function stopResize() {
      heightResizeStart.current = null
      horizontalResizeStart.current = null
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    function resize(event: PointerEvent) {
      if (heightResizeStart.current) {
        const delta = heightResizeStart.current.y - event.clientY
        setBottomHeight(clampBottomHeight(heightResizeStart.current.height + delta))
        return
      }

      if (!horizontalResizeStart.current) {
        return
      }

      const delta = event.clientX - horizontalResizeStart.current.x
      const resizeStart = horizontalResizeStart.current

      if (resizeStart.type === 'top') {
        setTopSizes((sizes) => ({
          ...sizes,
          [resizeStart.side]: clamp(
            resizeStart.side === 'files'
              ? resizeStart.width + delta
              : resizeStart.width - delta,
            MIN_TOP_SIDE_WIDTH,
            MAX_TOP_SIDE_WIDTH,
          ),
        }))
        return
      }

      setBottomSizes(resizeBottomPanels(
        resizeStart.sizes,
        resizeStart.left,
        resizeStart.right,
        resizeStart.rightIsLast,
        delta,
      ))
    }

    window.addEventListener('pointermove', resize)
    window.addEventListener('pointerup', stopResize)
    window.addEventListener('pointercancel', stopResize)

    return () => {
      window.removeEventListener('pointermove', resize)
      window.removeEventListener('pointerup', stopResize)
      window.removeEventListener('pointercancel', stopResize)
      stopResize()
    }
  }, [])

  return (
    <main className={styles.app} data-panel={panel}>
      {place(titleBar, styles.title)}

      <div className={styles.viewControls} aria-label="Afficher ou masquer les zones">
        <span className={styles.viewLabel}>Affichage</span>
        {TABS.map((tab) => {
          const visible = !hiddenPanels[tab.key]
          return (
            <button
              key={tab.key}
              type="button"
              className={visible ? `${styles.viewButton} ${styles.viewButtonActive}` : styles.viewButton}
              aria-pressed={visible}
              title={visible ? `Masquer ${tab.label}` : `Afficher ${tab.label}`}
              onClick={() => togglePanel(tab.key)}
            >
              {visible ? '✓' : '+'} {tab.label}
            </button>
          )
        })}
      </div>

      <div className={styles.topArea} style={{ gridTemplateColumns: topColumns }}>
        {place(files, styles.files, hiddenPanels.files)}
        {place(editor, styles.code)}
        {place(usefulCommands, styles.commands, hiddenPanels.help)}
        {!hiddenPanels.files && renderTopResizeHandle('files')}
        {!hiddenPanels.help && renderTopResizeHandle('help')}
      </div>

      {hasBottomPanel && (
        <div
          className={styles.resizeHandle}
          role="separator"
          aria-label="Redimensionner la zone commandes, console et logs"
          aria-orientation="horizontal"
          aria-valuemin={MIN_BOTTOM_HEIGHT}
          aria-valuemax={MAX_BOTTOM_HEIGHT}
          aria-valuenow={bottomHeight}
          tabIndex={0}
          title="Glisser vers le haut pour agrandir la zone du bas"
          onPointerDown={startHeightResize}
          onKeyDown={resizeHeightWithKeyboard}
        >
          <span className={styles.resizeIcon}>↕</span>
        </div>
      )}

      {hasBottomPanel && (
        <div
          className={styles.bottomArea}
          style={{ gridTemplateColumns: bottomColumns, height: bottomHeight }}
        >
          {place(logs, styles.logs, hiddenPanels.logs)}
          {place(command, styles.cmd, hiddenPanels.command)}
          {place(console, styles.console, hiddenPanels.console)}
          {visibleBottomPanels.slice(0, -1).map((_, index) =>
            renderBottomResizeHandle(index),
          )}
        </div>
      )}

      {visibleTabs.length > 0 && (
        <nav className={styles.mobileTabs} aria-label="Choisir la zone affichée">
          {visibleTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={panel === tab.key ? `${styles.tab} ${styles.tabActive}` : styles.tab}
              aria-pressed={panel === tab.key}
              onClick={() => setPanel(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      )}
    </main>
  )
}

export default EditorLayout
