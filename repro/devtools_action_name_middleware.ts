// Probe G: matrix of devtools composed with other middlewares —
// (a) explicit action name (3rd setState arg), (b) derived action name
const mem = new Map<string, string>()
const fakeStateStorage = {
  getItem: (k: string) => mem.get(k) ?? null,
  setItem: (k: string, v: string) => void mem.set(k, v),
  removeItem: (k: string) => void mem.delete(k),
}
let sends: any[] = []
const connection = {
  init: () => {},
  subscribe: () => () => {},
  unsubscribe: () => {},
  send: (action: any) => sends.push(action.type),
}
;(globalThis as any).window = {
  __REDUX_DEVTOOLS_EXTENSION__: { connect: () => connection },
}
const { createStore } = await import(
  '../src/vanilla.ts'
)
const mw = await import('../src/middleware.ts')
const im = await import('../src/middleware/immer.ts')
const { persist, devtools, createJSONStorage, subscribeWithSelector } = mw
const { immer } = im
const storage = createJSONStorage(() => fakeStateStorage) as any

const base = (set: any) => ({ count: 0, inc: () => set({ count: 1 }) })

function report(label: string, creator: any) {
  const store: any = createStore(creator)
  sends = []
  function callerExplicit() {
    store.setState({ count: 1 }, false, 'EXPLICIT_NAME')
  }
  callerExplicit()
  const explicit = sends.slice()
  sends = []
  function callerAnonymous() {
    store.setState({ count: 2 })
  }
  callerAnonymous()
  const anonymous = sends.slice()
  console.log(
    label.padEnd(42),
    'explicit->',
    JSON.stringify(explicit),
    '| anonymous->',
    JSON.stringify(anonymous),
  )
}

report('devtools(fn)', devtools(base))
report('devtools(immer(fn))', devtools(immer(base as any) as any))
report('devtools(persist(fn))', devtools(persist(base, { name: 'g1', storage }) as any) as any)
report(
  'devtools(persist(immer(fn)))',
  devtools(persist(immer(base as any) as any, { name: 'g2', storage }) as any) as any,
)
report(
  'devtools(persist(subscribeWithSelector(fn)))',
  devtools(
    persist(subscribeWithSelector(base) as any, { name: 'g3', storage } as any) as any,
  ) as any,
)
report('devtools(subscribeWithSelector(fn))', devtools(subscribeWithSelector(base)) as any)
