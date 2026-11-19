import React, { useEffect, useMemo, useState } from 'react';
import {
Check,
ChevronDown,
Flame,
Plus,
Trash2,
X,
} from 'lucide-react';
import {
Dialog,
DialogBackdrop,
DialogClose,
DialogContent,
DialogDescription,
DialogTitle,
DialogTrigger,
} from '@ui-sdk/react/dialog';
import {
Select,
SelectContent,
SelectItem,
SelectItemIndicator,
SelectItemText,
SelectTrigger,
SelectValue,
} from '@ui-sdk/react/select';
import {
SegmentedControl,
SegmentedControlIndicator,
SegmentedControlItem,
} from '@ui-sdk/react/segmented-control';
import {
Progress,
ProgressIndicator,
ProgressTrack,
} from '@ui-sdk/react/progress';
import { Switch, SwitchThumb } from '@ui-sdk/react/switch';

type HabitCategory = 'Focus' | 'Health' | 'Craft' | 'Rest';
type FilterMode = 'all' | 'remaining' | 'done';

interface Habit {
id: string;
name: string;
category: HabitCategory;
note: string;
weeklyTarget: number;
completedDates: string[];
}

interface DaySlot {
key: string;
weekday: string;
dayNumber: string;
isToday: boolean;
}

const STORAGE_KEY = 'habit-ledger-v1';

const CATEGORIES: HabitCategory[] = ['Focus', 'Health', 'Craft', 'Rest'];
const WEEKLY_TARGETS = [
{ value: '7', label: 'Every day (7/wk)' },
{ value: '5', label: 'Weekdays (5/wk)' },
{ value: '4', label: '4 days / week' },
{ value: '3', label: '3 days / week' },
];

function formatDateKey(date: Date): string {
const year = date.getFullYear();
const month = String(date.getMonth() + 1).padStart(2, '0');
const day = String(date.getDate()).padStart(2, '0');
return `${year}-${month}-${day}`;
}

function getLastSevenDays(): DaySlot[] {
const today = new Date();
today.setHours(0, 0, 0, 0);

const slots: DaySlot[] = [];
for (let offset = 6; offset >= 0; offset -= 1) {
const d = new Date(today);
d.setDate(today.getDate() - offset);
slots.push({
key: formatDateKey(d),
weekday: d.toLocaleDateString('en-US', { weekday: 'short' }),
dayNumber: String(d.getDate()),
isToday: offset === 0,
});
}
return slots;
}

function createStarterHabits(days: DaySlot[]): Habit[] {
const d = (index: number) => days[index]?.key ?? '';
return [
{
id: 'habit-morning-pages',
name: 'Morning pages',
category: 'Craft',
note: 'Three handwritten pages before opening email',
weeklyTarget: 7,
completedDates: [d(0), d(1), d(2), d(4), d(5), d(6)],
},
{
id: 'habit-walk',
name: '30-minute walk outside',
category: 'Health',
note: 'Midday daylight loop without headphones',
weeklyTarget: 5,
completedDates: [d(1), d(2), d(3), d(5), d(6)],
},
{
id: 'habit-deep-work',
name: '90-minute focus block',
category: 'Focus',
note: 'Single task with notifications silenced',
weeklyTarget: 5,
completedDates: [d(0), d(1), d(3), d(4), d(5)],
},
{
id: 'habit-read',
name: 'Read 20 pages before bed',
category: 'Rest',
note: 'Paper book, phone charging in the hallway',
weeklyTarget: 7,
completedDates: [d(0), d(2), d(3), d(4), d(5), d(6)],
},
];
}

function calculateCurrentStreak(completedDates: string[], days: DaySlot[]): number {
const set = new Set(completedDates);
const todayKey = days[days.length - 1]?.key;
const yesterdayKey = days[days.length - 2]?.key;

let startIndex = days.length - 1;
if (!set.has(todayKey)) {
if (yesterdayKey && set.has(yesterdayKey)) {
startIndex = days.length - 2;
} else {
return 0;
}
}

let streak = 0;
for (let i = startIndex; i >= 0; i -= 1) {
if (set.has(days[i].key)) {
streak += 1;
} else {
break;
}
}
return streak;
}

export function App() {
const days = useMemo(() => getLastSevenDays(), []);
const todayKey = days[days.length - 1].key;

const [habits, setHabits] = useState<Habit[]>(() => {
try {
const saved = window.localStorage.getItem(STORAGE_KEY);
if (saved) {
const parsed = JSON.parse(saved) as Habit[];
if (Array.isArray(parsed) && parsed.length > 0) {
return parsed;
}
}
} catch {
// Fall back to starter habits if storage is unavailable
}
return createStarterHabits(days);
});

const [filter, setFilter] = useState<FilterMode>('all');
const [showNotes, setShowNotes] = useState<boolean>(true);
const [dialogOpen, setDialogOpen] = useState<boolean>(false);

const [newName, setNewName] = useState<string>('');
const [newCategory, setNewCategory] = useState<HabitCategory>('Focus');
const [newTarget, setNewTarget] = useState<string>('5');
const [newNote, setNewNote] = useState<string>('');

useEffect(() => {
try {
window.localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
} catch {
// Ignore storage write errors
}
}, [habits]);

const toggleDate = (habitId: string, dateKey: string) => {
setHabits((prev) =>
prev.map((habit) => {
if (habit.id !== habitId) return habit;
const exists = habit.completedDates.includes(dateKey);
const completedDates = exists
? habit.completedDates.filter((d) => d !== dateKey)
: [...habit.completedDates, dateKey];
return { ...habit, completedDates };
})
);
};

const deleteHabit = (habitId: string) => {
setHabits((prev) => prev.filter((habit) => habit.id !== habitId));
};

const handleAddHabit = (event: React.FormEvent) => {
event.preventDefault();
const trimmedName = newName.trim();
if (!trimmedName) return;

const habit: Habit = {
id: `habit-${Date.now()}`,
name: trimmedName,
category: newCategory,
note: newNote.trim(),
weeklyTarget: Number(newTarget) || 5,
completedDates: [],
};

setHabits((prev) => [...prev, habit]);
setNewName('');
setNewNote('');
setNewCategory('Focus');
setNewTarget('5');
setDialogOpen(false);
};

const dayKeySet = useMemo(() => new Set(days.map((d) => d.key)), [days]);

const weeklyStats = useMemo(() => {
const totalPossible = habits.length * days.length;
let totalCompleted = 0;
let completedToday = 0;
let bestStreak = 0;

for (const habit of habits) {
const weekCount = habit.completedDates.filter((d) => dayKeySet.has(d)).length;
totalCompleted += weekCount;
if (habit.completedDates.includes(todayKey)) {
completedToday += 1;
}
const streak = calculateCurrentStreak(habit.completedDates, days);
if (streak > bestStreak) {
bestStreak = streak;
}
}

const rate = totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;

const dailyCounts = days.map((day) => ({
key: day.key,
count: habits.filter((h) => h.completedDates.includes(day.key)).length,
}));

return {
totalCompleted,
totalPossible,
completedToday,
bestStreak,
rate,
dailyCounts,
};
}, [habits, days, dayKeySet, todayKey]);

const visibleHabits = useMemo(() => {
if (filter === 'remaining') {
return habits.filter((h) => !h.completedDates.includes(todayKey));
}
if (filter === 'done') {
return habits.filter((h) => h.completedDates.includes(todayKey));
}
return habits;
}, [habits, filter, todayKey]);

const dateRangeLabel = useMemo(() => {
const first = new Date(`${days[0].key}T00:00:00`);
const last = new Date(`${days[days.length - 1].key}T00:00:00`);
const fmt = (date: Date) =>
date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
return `${fmt(first)} – ${fmt(last)}`;
}, [days]);

return (
<div className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
<div className="mx-auto max-w-4xl space-y-6">
<header className="flex flex-col gap-4 border-b border-[var(--stone-border)] pb-6 sm:flex-row sm:items-end sm:justify-between">
<div>
<p className="font-mono-num text-xs uppercase tracking-wider text-[var(--stone-ink-muted)]">
{dateRangeLabel}
</p>
<h1 className="font-editorial mt-1 text-3xl font-medium tracking-tight text-[var(--stone-ink)] sm:text-4xl">
Habit Ledger
</h1>
<p className="mt-1 text-sm text-[var(--stone-ink-secondary)]">
A quiet record of daily routines and seven-day consistency.
</p>
</div>

<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
<DialogTrigger className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-[var(--stone-ink)] px-4 py-2 text-sm font-medium text-[#faf9f6] transition-opacity hover:opacity-90">
<Plus className="h-4 w-4" />
Add habit
</DialogTrigger>

<DialogBackdrop />
<DialogContent>
<div className="flex items-start justify-between gap-4">
<div>
<DialogTitle className="font-editorial text-2xl font-medium text-[var(--stone-ink)]">
New habit
</DialogTitle>
<DialogDescription className="mt-1 text-sm text-[var(--stone-ink-secondary)]">
Add a daily routine to track across the rolling seven-day ledger.
</DialogDescription>
</div>
<DialogClose
aria-label="Close dialog"
className="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-[var(--stone-ink-muted)] hover:bg-[var(--stone-subtle)] hover:text-[var(--stone-ink)]"
>
<X className="h-4 w-4" />
</DialogClose>
</div>

<form onSubmit={handleAddHabit} className="mt-5 space-y-4">
<div>
<label
htmlFor="habit-name"
className="block text-xs font-medium uppercase tracking-wide text-[var(--stone-ink-secondary)]"
>
Habit name
</label>
<input
id="habit-name"
type="text"
required
value={newName}
onChange={(e) => setNewName(e.target.value)}
placeholder="e.g., Stretch for 10 minutes"
className="mt-1.5 w-full rounded-lg border border-[var(--stone-border-strong)] bg-[var(--stone-surface)] px-3 py-2 text-sm text-[var(--stone-ink)] placeholder:text-[var(--stone-ink-muted)] focus:border-[var(--stone-ink)] focus:outline-none"
/>
</div>

<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
<div>
<label className="block text-xs font-medium uppercase tracking-wide text-[var(--stone-ink-secondary)]">
Category
</label>
<div className="mt-1.5">
<Select
value={newCategory}
onValueChange={(val) => setNewCategory(val as HabitCategory)}
>
<SelectTrigger aria-label="Category">
<SelectValue placeholder="Choose category" />
<ChevronDown className="h-4 w-4 text-[var(--stone-ink-muted)]" />
</SelectTrigger>
<SelectContent>
{CATEGORIES.map((category) => (
<SelectItem key={category} value={category} label={category}>
<SelectItemText>{category}</SelectItemText>
<SelectItemIndicator>
<Check className="h-3.5 w-3.5 text-[var(--moss)]" />
</SelectItemIndicator>
</SelectItem>
))}
</SelectContent>
</Select>
</div>
</div>

<div>
<label className="block text-xs font-medium uppercase tracking-wide text-[var(--stone-ink-secondary)]">
Weekly target
</label>
<div className="mt-1.5">
<Select value={newTarget} onValueChange={setNewTarget}>
<SelectTrigger aria-label="Weekly target">
<SelectValue placeholder="Choose target" />
<ChevronDown className="h-4 w-4 text-[var(--stone-ink-muted)]" />
</SelectTrigger>
<SelectContent>
{WEEKLY_TARGETS.map((target) => (
<SelectItem
key={target.value}
value={target.value}
label={target.label}
>
<SelectItemText>{target.label}</SelectItemText>
<SelectItemIndicator>
<Check className="h-3.5 w-3.5 text-[var(--moss)]" />
</SelectItemIndicator>
</SelectItem>
))}
</SelectContent>
</Select>
</div>
</div>
</div>

<div>
<label
htmlFor="habit-note"
className="block text-xs font-medium uppercase tracking-wide text-[var(--stone-ink-secondary)]"
>
Note (optional)
</label>
<input
id="habit-note"
type="text"
value={newNote}
onChange={(e) => setNewNote(e.target.value)}
placeholder="Short cue or time of day"
className="mt-1.5 w-full rounded-lg border border-[var(--stone-border-strong)] bg-[var(--stone-surface)] px-3 py-2 text-sm text-[var(--stone-ink)] placeholder:text-[var(--stone-ink-muted)] focus:border-[var(--stone-ink)] focus:outline-none"
/>
</div>

<div className="flex items-center justify-end gap-2 pt-2">
<DialogClose className="cursor-pointer rounded-lg border border-[var(--stone-border-strong)] px-3.5 py-2 text-sm font-medium text-[var(--stone-ink-secondary)] hover:bg-[var(--stone-subtle)]">
Cancel
</DialogClose>
<button
type="submit"
className="cursor-pointer rounded-lg bg-[var(--stone-ink)] px-4 py-2 text-sm font-medium text-[#faf9f6] transition-opacity hover:opacity-90"
>
Save habit
</button>
</div>
</form>
</DialogContent>
</Dialog>
</header>

<section
aria-label="Weekly completion summary"
className="rounded-xl border border-[var(--stone-border)] bg-[var(--stone-surface)] p-5"
>
<div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
<div>
<p className="text-xs font-medium uppercase tracking-wide text-[var(--stone-ink-muted)]">
7-Day Completion
</p>
<div className="mt-1 flex items-baseline gap-2">
<span className="font-editorial tabular-nums text-3xl font-medium text-[var(--stone-ink)]">
{weeklyStats.rate}%
</span>
<span className="font-mono-num text-xs text-[var(--stone-ink-muted)]">
{weeklyStats.totalCompleted} / {weeklyStats.totalPossible} checks
</span>
</div>
</div>

<div className="sm:border-l sm:border-[var(--stone-border)] sm:pl-5">
<p className="text-xs font-medium uppercase tracking-wide text-[var(--stone-ink-muted)]">
Today
</p>
<div className="mt-1 flex items-baseline gap-2">
<span className="font-editorial tabular-nums text-3xl font-medium text-[var(--stone-ink)]">
{weeklyStats.completedToday}
</span>
<span className="font-mono-num text-xs text-[var(--stone-ink-muted)]">
of {habits.length} completed
</span>
</div>
</div>

<div className="sm:border-l sm:border-[var(--stone-border)] sm:pl-5">
<p className="text-xs font-medium uppercase tracking-wide text-[var(--stone-ink-muted)]">
Best Active Streak
</p>
<div className="mt-1 flex items-baseline gap-2">
<span className="font-editorial tabular-nums text-3xl font-medium text-[var(--stone-ink)]">
{weeklyStats.bestStreak}
</span>
<span className="font-mono-num text-xs text-[var(--stone-ink-muted)]">
{weeklyStats.bestStreak === 1 ? 'day' : 'days'}
</span>
</div>
</div>
</div>

<div className="mt-5">
<Progress value={weeklyStats.rate} max={100} aria-label="Weekly completion rate">
<ProgressTrack>
<ProgressIndicator style={{ width: `${weeklyStats.rate}%` }} />
</ProgressTrack>
</Progress>
</div>
</section>

<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
<SegmentedControl
value={filter}
onValueChange={(value) => setFilter(value as FilterMode)}
aria-label="Filter habits"
>
<SegmentedControlIndicator />
<SegmentedControlItem value="all">All ({habits.length})</SegmentedControlItem>
<SegmentedControlItem value="remaining">
Remaining ({habits.length - weeklyStats.completedToday})
</SegmentedControlItem>
<SegmentedControlItem value="done">
Done today ({weeklyStats.completedToday})
</SegmentedControlItem>
</SegmentedControl>

<label className="inline-flex cursor-pointer items-center gap-2.5 text-sm text-[var(--stone-ink-secondary)]">
<Switch checked={showNotes} onCheckedChange={setShowNotes} aria-label="Show notes">
<SwitchThumb />
</Switch>
<span>Show notes</span>
</label>
</div>

<section
aria-label="Seven-day habit ledger"
className="overflow-hidden rounded-xl border border-[var(--stone-border)] bg-[var(--stone-surface)]"
>
<div className="overflow-x-auto">
<div className="min-w-[640px]">
<div className="grid grid-cols-[1fr_repeat(7,48px)_68px_36px] items-center border-b border-[var(--stone-border)] bg-[var(--stone-subtle)]/60 px-4 py-3 text-xs font-medium text-[var(--stone-ink-muted)]">
<span className="uppercase tracking-wide">Habit</span>
{days.map((day) => (
<div
key={day.key}
className={`flex flex-col items-center justify-center rounded-md py-1 ${
day.isToday
? 'bg-[var(--stone-surface)] text-[var(--stone-ink)] ring-1 ring-[var(--stone-border-strong)]'
: ''
}`}
>
<span className="text-[10px] uppercase tracking-wider">{day.weekday}</span>
<span className="font-mono-num text-xs font-semibold">{day.dayNumber}</span>
</div>
))}
<span className="text-right uppercase tracking-wide">Streak</span>
<span className="sr-only">Actions</span>
</div>

{visibleHabits.length === 0 ? (
<div className="px-6 py-12 text-center">
<p className="text-sm font-medium text-[var(--stone-ink)]">
No habits match this view.
</p>
<p className="mt-1 text-xs text-[var(--stone-ink-muted)]">
Switch filters or add a new habit to continue tracking.
</p>
</div>
) : (
<ul className="divide-y divide-[var(--stone-border)]">
{visibleHabits.map((habit) => {
const streak = calculateCurrentStreak(habit.completedDates, days);
const weekCompleted = habit.completedDates.filter((d) =>
dayKeySet.has(d)
).length;

return (
<li
key={habit.id}
className="grid grid-cols-[1fr_repeat(7,48px)_68px_36px] items-center px-4 py-3.5 transition-colors hover:bg-[var(--stone-bg)]/50"
>
<div className="min-w-0 pr-4">
<div className="flex items-center gap-2">
<span className="truncate text-sm font-medium text-[var(--stone-ink)]">
{habit.name}
</span>
<span className="shrink-0 whitespace-nowrap rounded border border-[var(--stone-border)] bg-[var(--stone-bg)] px-1.5 py-0.5 text-[11px] font-medium text-[var(--stone-ink-secondary)]">
{habit.category}
</span>
</div>
{showNotes && habit.note && (
<p className="mt-0.5 truncate text-xs text-[var(--stone-ink-muted)]">
{habit.note}
</p>
)}
<p className="font-mono-num mt-1 text-[11px] text-[var(--stone-ink-muted)]">
{weekCompleted}/{habit.weeklyTarget} weekly goal
</p>
</div>

{days.map((day) => {
const isCompleted = habit.completedDates.includes(day.key);
return (
<div key={day.key} className="flex items-center justify-center">
<button
type="button"
onClick={() => toggleDate(habit.id, day.key)}
aria-pressed={isCompleted}
aria-label={`Mark ${habit.name} as ${
isCompleted ? 'incomplete' : 'complete'
} on ${day.weekday} ${day.dayNumber}`}
className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border transition-colors ${
isCompleted
? 'border-[var(--moss-border)] bg-[var(--moss-soft)] text-[var(--moss)]'
: day.isToday
? 'border-[var(--stone-border-strong)] bg-[var(--stone-surface)] text-transparent hover:border-[var(--stone-ink-muted)]'
: 'border-[var(--stone-border)] bg-transparent text-transparent hover:border-[var(--stone-border-strong)] hover:bg-[var(--stone-subtle)]/50'
}`}
>
<Check className="h-4 w-4 stroke-[2.25]" />
</button>
</div>
);
})}

<div className="flex items-center justify-end gap-1">
<Flame
className={`h-3.5 w-3.5 ${
streak > 0
? 'text-[var(--amber-ink)]'
: 'text-[var(--stone-border-strong)]'
}`}
/>
<span className="font-mono-num text-sm font-medium text-[var(--stone-ink)]">
{streak}d
</span>
</div>

<div className="flex items-center justify-end">
<button
type="button"
onClick={() => deleteHabit(habit.id)}
aria-label={`Delete ${habit.name}`}
className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-[var(--stone-ink-muted)] transition-colors hover:bg-[var(--stone-subtle)] hover:text-[var(--stone-ink)]"
>
<Trash2 className="h-3.5 w-3.5" />
</button>
</div>
</li>
);
})}
</ul>
)}

<div className="grid grid-cols-[1fr_repeat(7,48px)_68px_36px] items-center border-t border-[var(--stone-border)] bg-[var(--stone-subtle)]/40 px-4 py-2.5 text-xs text-[var(--stone-ink-muted)]">
<span className="font-medium">Daily total</span>
{weeklyStats.dailyCounts.map((item) => (
<span
key={item.key}
className="font-mono-num text-center font-medium text-[var(--stone-ink-secondary)]"
>
{item.count}/{habits.length}
</span>
))}
<span />
<span />
</div>
</div>
</div>
</section>
</div>
</div>
);
}

export default App;