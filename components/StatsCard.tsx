import { formatCurrency } from '../lib/utils';

type CardType = 'balance' | 'income' | 'expense' | 'savings';

interface Props {
  label: string;
  amount: number;
  type: CardType;
  subtitle?: string;
}

const CONFIG: Record<CardType, { icon: string; color: string; bg: string }> = {
  balance:  { icon: '💼', color: '#6366F1', bg: 'rgba(99,102,241,0.12)' },
  income:   { icon: '📥', color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
  expense:  { icon: '📤', color: '#F43F5E', bg: 'rgba(244,63,94,0.12)' },
  savings:  { icon: '🪙', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
};

export default function StatsCard({ label, amount, type, subtitle }: Props) {
  const cfg = CONFIG[type];
  const isNeg = amount < 0;
  const displayColor =
    type === 'income'   ? '#10B981' :
    type === 'expense'  ? '#F43F5E' :
    isNeg               ? '#F43F5E' : cfg.color;

  return (
    <div className={`stat-card ${type}`}>
      <div className="stat-icon" style={{ background: cfg.bg, color: cfg.color }}>
        {cfg.icon}
      </div>
      <div className="stat-label">{label}</div>
      <div className="stat-amount" style={{ color: displayColor }}>
        {type === 'income' ? '+' : type === 'expense' ? '-' : ''}
        {formatCurrency(Math.abs(amount))}
      </div>
      {subtitle && <div className="stat-change">{subtitle}</div>}
    </div>
  );
}
