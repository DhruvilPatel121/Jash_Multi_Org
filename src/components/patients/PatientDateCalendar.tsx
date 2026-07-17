import { Calendar } from "@/components/ui/calendar";
import { format, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";

const CELL_SIZE_MOBILE = "w-[2.5rem]";
const CELL_SIZE_TABLET = "sm:w-[3rem]";
const CELL_SIZE_DESKTOP = "md:w-[3.5rem]";

interface PatientDateCalendarProps {
  selected?: Date;
  onSelect: (date: Date | undefined) => void;
  patientCounts: Record<string, number>;
  className?: string;
}

export function PatientDateCalendar({
  selected,
  onSelect,
  patientCounts,
  className,
}: PatientDateCalendarProps) {
  const handleSelect = (date: Date | undefined) => {
    if (date && selected && isSameDay(date, selected)) {
      onSelect(undefined);
      return;
    }
    onSelect(date);
  };

  return (
    <Calendar
      mode="single"
      selected={selected}
      onSelect={handleSelect}
      showOutsideDays
      initialFocus
      formatters={{
        formatWeekdayName: (date) => format(date, "EEE").slice(0, 2),
      }}
      className={cn("w-full max-w-[calc(100vw-3rem)] p-0", className)}
      classNames={{
        months: "flex flex-col",
        month: "space-y-3",
        caption: "flex justify-center pt-1 relative items-center mb-1",
        caption_label: "text-sm sm:text-base font-semibold",
        nav_button: cn(
          "inline-flex items-center justify-center rounded-md border border-input bg-background size-7 sm:size-8 p-0 opacity-70 hover:opacity-100",
        ),
        nav_button_previous: "absolute left-0",
        nav_button_next: "absolute right-0",
        table: "w-full border-collapse",
        head_row: "flex justify-center",
        head_cell: cn(
          CELL_SIZE_MOBILE,
          CELL_SIZE_TABLET,
          CELL_SIZE_DESKTOP,
          "text-muted-foreground font-medium text-[0.7rem] sm:text-xs flex items-center justify-center h-6 sm:h-8",
        ),
        row: "flex w-full justify-center mt-0.5",
        cell: cn(
          CELL_SIZE_MOBILE,
          CELL_SIZE_TABLET,
          CELL_SIZE_DESKTOP,
          "relative p-0 text-center focus-within:relative focus-within:z-20 [&:has([aria-selected])]:rounded-lg",
        ),
        day: cn(
          CELL_SIZE_MOBILE,
          CELL_SIZE_TABLET,
          CELL_SIZE_DESKTOP,
          "h-[2.5rem] sm:h-[3rem] md:h-[3.5rem] p-0 font-normal rounded-lg hover:bg-slate-100 aria-selected:opacity-100",
        ),
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent/60 text-accent-foreground",
        day_outside: "text-muted-foreground opacity-40 aria-selected:opacity-30",
        day_disabled: "text-muted-foreground opacity-30",
      }}
      components={{
        DayContent: ({ date }) => {
          const dateStr = format(date, "yyyy-MM-dd");
          const count = patientCounts[dateStr];

          return (
            <div className="flex flex-col items-center justify-center gap-1 pointer-events-none">
              <span className="text-xs sm:text-sm font-semibold leading-none">
                {date.getDate()}
              </span>
              {count ? (
                <span className="inline-flex items-center justify-center min-w-[1.25rem] sm:min-w-[1.375rem] h-[1.25rem] sm:h-[1.375rem] px-1 rounded-full bg-emerald-100 text-emerald-700 text-[0.65rem] sm:text-[10px] font-bold leading-none">
                  {count}
                </span>
              ) : null}
            </div>
          );
        },
      }}
    />
  );
}
