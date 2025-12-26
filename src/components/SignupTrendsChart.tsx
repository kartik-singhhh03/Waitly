import { useMemo } from 'react';
import { format, subDays, startOfDay, parseISO } from 'date-fns';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { WaitlistEntry } from '@/hooks/useProjects';

interface SignupTrendsChartProps {
  entries: WaitlistEntry[];
  days?: number;
}

export const SignupTrendsChart = ({ entries, days = 30 }: SignupTrendsChartProps) => {
  const chartData = useMemo(() => {
    const today = startOfDay(new Date());
    const dateMap = new Map<string, number>();

    // Initialize all days with 0
    for (let i = days - 1; i >= 0; i--) {
      const date = format(subDays(today, i), 'yyyy-MM-dd');
      dateMap.set(date, 0);
    }

    // Count signups per day
    entries.forEach((entry) => {
      const date = format(parseISO(entry.joined_at), 'yyyy-MM-dd');
      if (dateMap.has(date)) {
        dateMap.set(date, (dateMap.get(date) || 0) + 1);
      }
    });

    // Convert to array for chart
    return Array.from(dateMap.entries()).map(([date, count]) => ({
      date,
      signups: count,
      label: format(parseISO(date), 'MMM d'),
    }));
  }, [entries, days]);

  const totalInPeriod = chartData.reduce((sum, d) => sum + d.signups, 0);

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Signup Trends</h3>
          <p className="text-sm text-muted-foreground">Last {days} days</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-foreground">{totalInPeriod}</p>
          <p className="text-sm text-muted-foreground">signups</p>
        </div>
      </div>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="signupGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="hsl(var(--border))" 
              vertical={false}
            />
            <XAxis 
              dataKey="label" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              interval="preserveStartEnd"
              tickMargin={8}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              allowDecimals={false}
              tickMargin={8}
            />
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-popover border border-border rounded-lg shadow-lg px-3 py-2">
                      <p className="text-sm font-medium text-foreground">
                        {payload[0].payload.label}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {payload[0].value} signup{payload[0].value !== 1 ? 's' : ''}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="signups"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fill="url(#signupGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
