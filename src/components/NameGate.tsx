import type { UserName } from '../types'

const users: UserName[] = ['Jordan', 'Camila', 'Ari']

type NameGateProps = {
  onChoose: (name: UserName) => void
}

export const NameGate = ({ onChoose }: NameGateProps) => (
  <div className="name-gate" role="dialog" aria-modal="true">
    <div className="name-card">
      <p className="eyebrow">Cozy apartment crew</p>
      <h1>Who's decorating?</h1>
      <div className="name-options">
        {users.map((name) => (
          <button key={name} type="button" onClick={() => onChoose(name)}>
            {name}
          </button>
        ))}
      </div>
    </div>
  </div>
)
