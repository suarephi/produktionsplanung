'use client';

import { useMemo, useState, useRef } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, useDraggable, useDroppable } from '@dnd-kit/core';
import { usePlanning } from '../context/PlanningContext';
import { workProcesses } from '../data/mockData';
import { WorkProcessType, ScheduledTask } from '../types';

function getDatesInRange(start: Date, end: Date): Date[] {
  const dates: Date[] = [];
  const current = new Date(start);
  while (current <= end) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

function formatDate(date: Date): string {
  return `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}`;
}

function getDayName(date: Date, lang: 'de' | 'en'): string {
  const days = lang === 'de'
    ? ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[date.getDay()];
}

function isWeekend(date: Date): boolean {
  return date.getDay() === 0 || date.getDay() === 6;
}

function getDateIndex(dates: Date[], dateStr: string): number {
  return dates.findIndex(d => d.toISOString().split('T')[0] === dateStr);
}

// Draggable Task Component with resize handles
function DraggableTask({
  task,
  order,
  cellWidth,
  onResize,
}: {
  task: ScheduledTask;
  order: { id: string; name: string; color: string } | undefined;
  cellWidth: number;
  onResize: (taskId: string, newDurationDays: number) => void;
}) {
  const { openTaskModal } = usePlanning();
  const [isResizing, setIsResizing] = useState(false);
  const resizeStartX = useRef(0);
  const initialDuration = useRef(1);

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
    data: task,
    disabled: isResizing,
  });

  const durationDays = task.durationDays || 1;
  const taskWidth = durationDays * cellWidth - 8;

  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(true);
    resizeStartX.current = e.clientX;
    initialDuration.current = durationDays;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - resizeStartX.current;
      const deltaDays = Math.round(deltaX / cellWidth);
      const newDuration = Math.max(1, initialDuration.current + deltaDays);
      onResize(task.id, newDuration);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  if (!order) return null;

  return (
    <div
      ref={setNodeRef}
      {...(!isResizing ? listeners : {})}
      {...(!isResizing ? attributes : {})}
      onClick={(e) => {
        if (!isResizing) {
          e.stopPropagation();
          openTaskModal({ task });
        }
      }}
      className={`absolute top-1 h-[calc(100%-8px)] rounded-md flex items-center text-[10px] font-bold text-white shadow-sm transition-all ${
        isDragging ? 'opacity-50 scale-105 cursor-grabbing' : 'cursor-grab hover:shadow-md'
      }`}
      style={{
        backgroundColor: order.color,
        width: taskWidth,
        left: 4,
        zIndex: isDragging ? 100 : 10,
      }}
      title={`${order.name} - ${durationDays} ${durationDays === 1 ? 'Tag' : 'Tage'}`}
    >
      <span className="px-2 truncate flex-1">{order.name}</span>
      {durationDays > 1 && (
        <span className="px-1 text-[8px] opacity-75">{durationDays}d</span>
      )}
      {/* Resize handle */}
      <div
        onMouseDown={handleResizeStart}
        className="absolute right-0 top-0 bottom-0 w-3 cursor-ew-resize hover:bg-white/20 rounded-r-md flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-0.5 h-4 bg-white/40 rounded" />
      </div>
    </div>
  );
}

// Droppable Cell Component
function DroppableCell({
  id,
  date,
  employeeId,
  processType,
  hasTask,
  cellWidth,
  rowHeight,
  showWeekend,
  children,
}: {
  id: string;
  date: Date;
  employeeId: string;
  processType: WorkProcessType;
  hasTask: boolean;
  cellWidth: number;
  rowHeight: number;
  showWeekend: boolean;
  children?: React.ReactNode;
}) {
  const { openTaskModal } = usePlanning();
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: { date: date.toISOString().split('T')[0], employeeId, processType },
  });

  const weekend = isWeekend(date);
  if (!showWeekend && weekend) return null;

  const handleClick = () => {
    if (!hasTask) {
      openTaskModal({
        defaultDate: date.toISOString().split('T')[0],
        defaultEmployeeId: employeeId,
        defaultProcessType: processType,
      });
    }
  };

  return (
    <td
      ref={setNodeRef}
      onClick={handleClick}
      style={{ width: cellWidth, minWidth: cellWidth, height: rowHeight }}
      className={`relative px-1 py-1 border-r border-b border-slate-200 transition-colors ${
        weekend ? 'bg-slate-100' : ''
      } ${isOver ? 'bg-blue-100 ring-2 ring-inset ring-blue-400' : ''} ${
        !hasTask ? 'hover:bg-blue-50 cursor-pointer' : ''
      }`}
    >
      {children}
    </td>
  );
}

export default function GanttChart() {
  const {
    dateRange,
    tasks,
    orders,
    employees,
    machines,
    language,
    t,
    selectedOrderId,
    setSelectedOrderId,
    moveTask,
    updateTask,
    openTaskModal,
    diagramSettings,
  } = usePlanning();

  const [activeTask, setActiveTask] = useState<ScheduledTask | null>(null);

  const dates = useMemo(() => getDatesInRange(dateRange.start, dateRange.end), [dateRange]);

  const filteredDates = useMemo(() => {
    if (diagramSettings.showWeekends) return dates;
    return dates.filter(d => !isWeekend(d));
  }, [dates, diagramSettings.showWeekends]);

  const employeesByProcess = useMemo(() => {
    const grouped: Record<WorkProcessType, typeof employees> = {} as Record<WorkProcessType, typeof employees>;
    workProcesses.forEach(process => {
      grouped[process.id] = employees.filter(emp => emp.skills.includes(process.id));
    });
    return grouped;
  }, [employees]);

  const getOrderById = (id: string) => orders.find(o => o.id === id);
  const getMachineById = (id: string) => machines.find(m => m.id === id);

  // Get task that covers a specific cell (including multi-day tasks)
  const getTaskForCell = (employeeId: string, dateStr: string, processType: WorkProcessType) => {
    return tasks.find(task => {
      if (task.employeeId !== employeeId || task.processType !== processType) return false;
      const taskStartIndex = getDateIndex(dates, task.date);
      const cellIndex = getDateIndex(dates, dateStr);
      const durationDays = task.durationDays || 1;
      return cellIndex >= taskStartIndex && cellIndex < taskStartIndex + durationDays;
    });
  };

  // Check if a cell is the start of a task
  const isTaskStart = (employeeId: string, dateStr: string, processType: WorkProcessType) => {
    return tasks.some(
      task => task.employeeId === employeeId && task.date === dateStr && task.processType === processType
    );
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveTask(event.active.data.current as ScheduledTask);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);

    const { active, over } = event;
    if (!over || !active) return;

    const taskId = active.id as string;
    const dropData = over.data.current as { date: string; employeeId: string; processType: WorkProcessType };

    if (dropData) {
      moveTask(taskId, dropData.date, dropData.employeeId);
    }
  };

  const handleResize = (taskId: string, newDurationDays: number) => {
    updateTask(taskId, { durationDays: newDurationDays });
  };

  const activeOrder = activeTask ? getOrderById(activeTask.orderId) : null;

  const { cellWidth, rowHeight, showWeekends } = diagramSettings;

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Header with Add Button */}
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-700">{t('label.orders')}:</span>
            </div>
            <button
              onClick={() => openTaskModal()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-lg shadow-blue-500/30 transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {t('action.add')}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {orders.map(order => (
              <button
                key={order.id}
                onClick={() => setSelectedOrderId(selectedOrderId === order.id ? null : order.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedOrderId === order.id
                    ? 'ring-2 ring-offset-2 ring-blue-500 scale-105'
                    : 'hover:scale-105'
                }`}
                style={{
                  backgroundColor: order.color,
                  color: 'white',
                  opacity: selectedOrderId && selectedOrderId !== order.id ? 0.4 : 1,
                }}
              >
                {order.name}
              </button>
            ))}
            {selectedOrderId && (
              <button
                onClick={() => setSelectedOrderId(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-200 text-slate-700 hover:bg-slate-300"
              >
                ✕ {t('action.cancel')}
              </button>
            )}
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {language === 'de'
              ? 'Klicken Sie auf eine leere Zelle, um eine Aufgabe hinzuzufügen. Ziehen Sie Aufgaben zum Verschieben. Ziehen Sie am rechten Rand zum Verlängern.'
              : 'Click empty cell to add task. Drag tasks to move. Drag right edge to resize.'}
          </p>
        </div>

        {/* Gantt Grid */}
        <div className="overflow-x-auto">
          <table className="border-collapse" style={{ minWidth: 300 + filteredDates.length * cellWidth }}>
            <thead>
              <tr className="bg-slate-100">
                <th className="sticky left-0 z-20 bg-slate-100 px-3 py-2 text-left text-xs font-semibold text-slate-600 border-r border-slate-200" style={{ width: 120, minWidth: 120 }}>
                  {t('label.process')}
                </th>
                <th className="sticky left-[120px] z-20 bg-slate-100 px-3 py-2 text-left text-xs font-semibold text-slate-600 border-r border-slate-200" style={{ width: 100, minWidth: 100 }}>
                  {t('label.employee')}
                </th>
                <th className="sticky left-[220px] z-20 bg-slate-100 px-3 py-2 text-left text-xs font-semibold text-slate-600 border-r border-slate-200" style={{ width: 80, minWidth: 80 }}>
                  {t('label.machine')}
                </th>
                {filteredDates.map((date, idx) => (
                  <th
                    key={idx}
                    style={{ width: cellWidth, minWidth: cellWidth }}
                    className={`px-1 py-2 text-center text-xs font-medium border-r border-slate-200 ${
                      isWeekend(date) ? 'bg-slate-200 text-slate-500' : 'text-slate-700'
                    }`}
                  >
                    <div className="font-semibold">{formatDate(date)}</div>
                    <div className="text-[10px] text-slate-500">{getDayName(date, language)}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {workProcesses.map(process => (
                <>
                  <tr key={`header-${process.id}`} className="bg-slate-50">
                    <td
                      colSpan={3 + filteredDates.length}
                      className="px-3 py-2 text-sm font-bold border-b border-slate-200"
                      style={{ color: process.color }}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: process.color }}
                        />
                        {language === 'de' ? process.name : process.nameEn}
                      </div>
                    </td>
                  </tr>

                  {employeesByProcess[process.id]?.map(employee => {
                    const machine = employee.defaultMachine
                      ? getMachineById(employee.defaultMachine)
                      : null;

                    return (
                      <tr key={`${process.id}-${employee.id}`} className="hover:bg-blue-50/30 transition-colors">
                        <td className="sticky left-0 z-10 bg-white px-3 py-1.5 border-r border-b border-slate-200" style={{ width: 120 }} />
                        <td className="sticky left-[120px] z-10 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 border-r border-b border-slate-200 whitespace-nowrap" style={{ width: 100 }}>
                          {employee.name}
                        </td>
                        <td className="sticky left-[220px] z-10 bg-white px-3 py-1.5 text-xs text-slate-500 border-r border-b border-slate-200 whitespace-nowrap" style={{ width: 80 }}>
                          {machine?.name || '-'}
                        </td>
                        {filteredDates.map((date, idx) => {
                          const dateStr = date.toISOString().split('T')[0];
                          const task = getTaskForCell(employee.id, dateStr, process.id);
                          const isStart = isTaskStart(employee.id, dateStr, process.id);
                          const order = task ? getOrderById(task.orderId) : null;
                          const isFiltered = selectedOrderId && task && task.orderId !== selectedOrderId;
                          const cellId = `${employee.id}-${dateStr}-${process.id}`;

                          return (
                            <DroppableCell
                              key={idx}
                              id={cellId}
                              date={date}
                              employeeId={employee.id}
                              processType={process.id}
                              hasTask={!!task}
                              cellWidth={cellWidth}
                              rowHeight={rowHeight}
                              showWeekend={showWeekends}
                            >
                              {isStart && task && order && (
                                <div className={isFiltered ? 'opacity-20' : ''}>
                                  <DraggableTask
                                    task={task}
                                    order={order}
                                    cellWidth={cellWidth}
                                    onResize={handleResize}
                                  />
                                </div>
                              )}
                            </DroppableCell>
                          );
                        })}
                      </tr>
                    );
                  })}
                </>
              ))}
            </tbody>
          </table>
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeTask && activeOrder && (
            <div
              className="rounded-md flex items-center justify-center text-[10px] font-bold text-white shadow-xl"
              style={{
                backgroundColor: activeOrder.color,
                width: (activeTask.durationDays || 1) * cellWidth - 8,
                height: rowHeight - 8,
              }}
            >
              {activeOrder.name}
            </div>
          )}
        </DragOverlay>
      </div>
    </DndContext>
  );
}
