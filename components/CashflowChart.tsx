'use client';

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { formatCurrency } from '../lib/utils';

interface ChartData { month: string; income: number; expense: number; }

export default function CashflowChart({ data }: { data: ChartData[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ top: 10, right: 0, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="gradIncome" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#10B981" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradExpense" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#F43F5E" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#F43F5E" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
        <XAxis dataKey="month" tick={{ fill: '#7B8DB0', fontSize: 12 }} tickLine={false} axisLine={false} />
        <YAxis
          tick={{ fill: '#7B8DB0', fontSize: 11 }} tickLine={false} axisLine={false}
          tickFormatter={(v: number) => v >= 1_000_000 ? `${(v/1_000_000).toFixed(0)}jt` : `${(v/1_000).toFixed(0)}rb`}
        />
        <Tooltip
          contentStyle={{ background: 'rgba(8,11,18,0.95)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', fontSize: '13px' }}
          labelStyle={{ color: '#7B8DB0', marginBottom: '4px' }}
          formatter={(value: any, name: any) => [formatCurrency(Number(value || 0)), name === 'income' ? 'Pemasukan' : 'Pengeluaran']}
        />
        <Legend formatter={(v) => v === 'income' ? 'Pemasukan' : 'Pengeluaran'} wrapperStyle={{ fontSize: '12px', color: '#7B8DB0', paddingTop: '12px' }} />
        <Area type="monotone" dataKey="income" stroke="#10B981" strokeWidth={2} fill="url(#gradIncome)" dot={{ fill: '#10B981', r: 3, strokeWidth: 0 }} activeDot={{ r: 5, strokeWidth: 0 }} />
        <Area type="monotone" dataKey="expense" stroke="#F43F5E" strokeWidth={2} fill="url(#gradExpense)" dot={{ fill: '#F43F5E', r: 3, strokeWidth: 0 }} activeDot={{ r: 5, strokeWidth: 0 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
