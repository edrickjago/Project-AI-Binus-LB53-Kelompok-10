'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '../lib/utils';

interface CategoryData { name: string; value: number; color: string; }

export default function CategoryChart({ data }: { data: CategoryData[] }) {
  if (data.length === 0) {
    return (
      <div className="empty-state" style={{ padding: '32px 0' }}>
        <span className="empty-icon">📊</span>
        <p>Belum ada data pengeluaran bulan ini</p>
      </div>
    );
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={52} outerRadius={80} paddingAngle={3} dataKey="value">
            {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
          </Pie>
          <Tooltip
            contentStyle={{ background: 'rgba(8,11,18,0.95)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', fontSize: '13px' }}
            formatter={(value: any) => [formatCurrency(Number(value || 0)), '']}
          />
        </PieChart>
      </ResponsiveContainer>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
        {data.slice(0, 5).map((item, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.color, flexShrink: 0 }} />
              <span style={{ color: 'var(--text-secondary)' }}>{item.name}</span>
            </div>
            <span style={{ fontWeight: 600 }}>{formatCurrency(item.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
