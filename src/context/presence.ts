import { createContext, useContext } from 'react'

/** Profile ids of the members currently connected to the member space
 *  (provided by PresenceProvider, PresenceContext.tsx). */
export const PresenceContext = createContext<Set<string>>(new Set())

export function useOnlineMembers() {
  return useContext(PresenceContext)
}
