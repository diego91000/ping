import { useEffect, useRef } from 'react'
import { useActivities } from '@/hooks/useActivities'
import type { ActivityKind } from '@/store/activityStore'
import styles from './ActivityList.module.css'

type ActivityListProps = {
  emptyLabel: string
  kind?: ActivityKind
}

function ActivityList({ emptyLabel, kind }: ActivityListProps) {
  const items = useActivities(kind)
  const bodyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const body = bodyRef.current
    if (body) {
      body.scrollTop = body.scrollHeight
    }
  }, [items.length])

  return (
    <div ref={bodyRef} className={styles.list} tabIndex={0}>
      {items.length === 0 ? (
        <p>{emptyLabel}</p>
      ) : (
        items.map((item) =>
          item.kind === 'command' ? (
            <div key={item.id} className={styles.line}>
              <span className={styles.prompt}>&gt;</span> {item.text}{' '}
              <span className={item.ok ? styles.ok : styles.ko}>
                {item.ok ? '✓' : '✗'}
              </span>
            </div>
          ) : (
            <div
              key={item.id}
              className={[styles.line, !item.ok && styles.error]
                .filter(Boolean)
                .join(' ')}
            >
              <span className={styles.time}>{item.time}</span> {item.text}
            </div>
          ),
        )
      )}
    </div>
  )
}

export default ActivityList
