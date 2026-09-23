import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { UnpaidWall } from '@/components/UnpaidWall'
import { useAuth } from '@/context/AuthContext'
import { useOnlineMembers } from '@/context/PresenceContext'
import { openChannel } from '@/lib/realtime'
import { supabase } from '@/lib/supabase'

interface MemberInfo {
  id: string
  last_name: string | null
  first_names: string | null
  nickname: string | null
  photo_url: string | null
}

interface MessageRow {
  id: string
  author_id: string
  content: string
  status: 'visible' | 'hidden'
  created_at: string
}

const HISTORY_LIMIT = 200

function memberName(m: MemberInfo | undefined) {
  if (!m) return 'Membre'
  return [m.last_name, m.first_names].filter(Boolean).join(' ') || 'Membre'
}

function shortName(m: MemberInfo) {
  return m.nickname || m.first_names?.split(' ')[0] || m.last_name || 'Membre'
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

function formatDay(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
}

function Avatar({ member, size, online }: { member: MemberInfo | undefined; size: string; online?: boolean }) {
  return (
    <div className={`relative shrink-0 ${size}`}>
      {member?.photo_url ? (
        <img src={member.photo_url} alt="" className="h-full w-full rounded-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center rounded-full bg-sambo-100 font-semibold text-sambo-700">
          {memberName(member).charAt(0)}
        </div>
      )}
      {online !== undefined && (
        <span
          className={`absolute right-0 bottom-0 h-3.5 w-3.5 rounded-full border-2 border-white ${
            online ? 'bg-green-500' : 'bg-gray-400'
          }`}
        />
      )}
    </div>
  )
}

export function Chat() {
  const { profile } = useAuth()
  const isAdmin = profile?.access_level === 'administrateur'
  const online = useOnlineMembers()

  const [members, setMembers] = useState<Record<string, MemberInfo>>({})
  const [messages, setMessages] = useState<MessageRow[]>([])
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    Promise.all([
      supabase
        .from('chat_messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(HISTORY_LIMIT),
      supabase.from('directory_profiles').select('id, last_name, first_names, nickname, photo_url'),
    ]).then(([messagesRes, membersRes]) => {
      if (messagesRes.error) setError(messagesRes.error.message)
      setMessages((messagesRes.data ?? []).reverse())
      const map: Record<string, MemberInfo> = {}
      for (const m of membersRes.data ?? []) map[m.id] = m
      setMembers(map)
      setLoading(false)
    })

    return openChannel('chat:global', undefined, (channel) => {
      channel
        .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_messages' }, (payload) => {
          if (payload.eventType === 'INSERT') {
            const row = payload.new as MessageRow
            setMessages((prev) => (prev.some((m) => m.id === row.id) ? prev : [...prev, row]))
          } else if (payload.eventType === 'UPDATE') {
            const row = payload.new as MessageRow
            setMessages((prev) => prev.map((m) => (m.id === row.id ? row : m)))
          } else if (payload.eventType === 'DELETE') {
            const id = (payload.old as Partial<MessageRow>).id
            setMessages((prev) => prev.filter((m) => m.id !== id))
          }
        })
        .subscribe()
    })
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [messages.length])

  // Online members first, then alphabetical.
  const memberList = useMemo(
    () =>
      Object.values(members).sort((a, b) => {
        const byOnline = Number(online.has(b.id)) - Number(online.has(a.id))
        return byOnline || memberName(a).localeCompare(memberName(b), 'fr')
      }),
    [members, online],
  )
  const onlineCount = memberList.filter((m) => online.has(m.id)).length

  async function send(e?: FormEvent) {
    e?.preventDefault()
    const content = draft.trim()
    if (!profile || !content || sending) return
    setSending(true)
    const { data, error: insertError } = await supabase
      .from('chat_messages')
      .insert({ author_id: profile.id, content })
      .select()
      .single()
    setSending(false)
    if (insertError) {
      setError(insertError.message)
      return
    }
    setDraft('')
    setMessages((prev) => (prev.some((m) => m.id === data.id) ? prev : [...prev, data]))
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  async function removeMessage(id: string) {
    const { error: deleteError } = await supabase.from('chat_messages').delete().eq('id', id)
    if (deleteError) setError(deleteError.message)
    else setMessages((prev) => prev.filter((m) => m.id !== id))
  }

  async function toggleHidden(msg: MessageRow) {
    const status = msg.status === 'visible' ? 'hidden' : 'visible'
    const { error: updateError } = await supabase.from('chat_messages').update({ status }).eq('id', msg.id)
    if (updateError) setError(updateError.message)
    else setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, status } : m)))
  }

  if (!profile || loading) return <p className="text-sambo-700/60">Chargement…</p>

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <section className="flex h-[calc(100dvh-4rem)] min-h-[32rem] flex-col overflow-hidden rounded-3xl border border-sambo-200/70 bg-white shadow-sm">
        <header className="flex flex-wrap items-center gap-3 border-b border-sambo-100 px-5 py-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold text-sambo-950">Chat SAMBO</h1>
            <p className="text-xs text-sambo-700/60">
              {onlineCount} en ligne · {memberList.length} membres
            </p>
          </div>
          <button
            type="button"
            disabled
            title="Les appels vidéo de groupe arriveront avec l'application mobile."
            className="flex cursor-not-allowed items-center gap-2 rounded-full border border-sambo-200 px-4 py-2 text-sm font-medium text-sambo-700/60"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden>
              <path d="m22 8-6 4 6 4V8Z" />
              <rect x="2" y="6" width="14" height="12" rx="2" />
            </svg>
            Appel vidéo · bientôt
          </button>
        </header>

        {/* Member bubbles */}
        <div className="flex gap-3 overflow-x-auto border-b border-sambo-100 px-5 py-3">
          {memberList.map((m) => (
            <div key={m.id} className="flex w-14 shrink-0 flex-col items-center gap-1" title={memberName(m)}>
              <Avatar member={m} size="h-12 w-12" online={online.has(m.id)} />
              <span className="w-full truncate text-center text-[11px] text-sambo-800/80">{shortName(m)}</span>
            </div>
          ))}
        </div>

        {/* Messages */}
        <div className="flex-1 space-y-3 overflow-y-auto bg-sambo-50/50 px-4 py-4">
          {messages.length === 0 && (
            <p className="py-10 text-center text-sm text-sambo-700/60">
              Aucun message pour l'instant. Lancez la conversation !
            </p>
          )}

          {messages.map((msg, i) => {
            const author = members[msg.author_id]
            const mine = msg.author_id === profile.id
            const hidden = msg.status === 'hidden'
            const newDay =
              i === 0 || new Date(messages[i - 1].created_at).toDateString() !== new Date(msg.created_at).toDateString()
            const sameAuthorAsPrevious = !newDay && i > 0 && messages[i - 1].author_id === msg.author_id

            return (
              <div key={msg.id}>
                {newDay && (
                  <p className="my-4 text-center text-xs font-medium text-sambo-700/50 first-letter:uppercase">
                    {formatDay(msg.created_at)}
                  </p>
                )}
                <div className={`group flex items-end gap-2 ${mine ? 'flex-row-reverse' : ''}`}>
                  {!mine &&
                    (sameAuthorAsPrevious ? (
                      <div className="w-8 shrink-0" />
                    ) : (
                      <Avatar member={author} size="h-8 w-8 text-sm" />
                    ))}
                  <div className={`max-w-[75%] ${hidden ? 'opacity-50' : ''}`}>
                    {!mine && !sameAuthorAsPrevious && (
                      <p className="mb-0.5 ml-3 text-xs font-medium text-sambo-800/80">{memberName(author)}</p>
                    )}
                    <div
                      className={`rounded-2xl px-3.5 py-2 text-sm whitespace-pre-line break-words ${
                        mine ? 'rounded-br-md bg-sambo-700 text-white' : 'rounded-bl-md bg-white text-sambo-950 shadow-sm'
                      }`}
                    >
                      {msg.content}
                    </div>
                    <div
                      className={`mt-0.5 flex gap-3 px-2 text-[11px] text-sambo-700/50 ${mine ? 'justify-end' : ''}`}
                    >
                      <span>{formatTime(msg.created_at)}</span>
                      {hidden && <span className="text-red-600">masqué</span>}
                      {mine && (
                        <button
                          type="button"
                          onClick={() => removeMessage(msg.id)}
                          className="hidden hover:underline group-hover:inline"
                        >
                          Supprimer
                        </button>
                      )}
                      {isAdmin && !mine && (
                        <button
                          type="button"
                          onClick={() => toggleHidden(msg)}
                          className="hidden hover:underline group-hover:inline"
                        >
                          {hidden ? 'Réafficher' : 'Masquer'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>

        {error && <p className="px-5 pt-2 text-sm text-red-600">{error}</p>}

        <form onSubmit={send} className="flex items-end gap-2 border-t border-sambo-100 p-3">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Écrire un message…"
            rows={1}
            maxLength={2000}
            className="max-h-32 min-h-10 flex-1 resize-none rounded-2xl border border-sambo-200 px-4 py-2 text-sm focus:border-sambo-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={sending || !draft.trim()}
            className="rounded-full bg-sambo-700 px-5 py-2 text-sm font-medium text-white hover:bg-sambo-800 disabled:opacity-60"
          >
            Envoyer
          </button>
        </form>
      </section>

      <UnpaidWall className="order-first h-72 lg:order-none lg:sticky lg:top-8 lg:h-[calc(100dvh-4rem)]" />
    </div>
  )
}
