import React, { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, X, CircleSlash } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface AttendanceCalendarProps {
  attendance: Record<string, "present" | "absent" | "consulting"> | undefined;
  archivedDates?: string[];
  onAttendanceChange: (
    date: Date,
    status: "present" | "absent" | "consulting" | null,
  ) => void;
  isLocked?: boolean;
}

const ConsultingIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    stroke="currentColor"
    strokeWidth="3.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M16 6C12.69 4.64 8.51 5.52 6 8.5C4.08 10.75 4.08 14.25 6 16.5C8.51 19.48 12.69 20.36 16 19" />
  </svg>
);

export function AttendanceCalendar({
  attendance = {},
  archivedDates = [],
  onAttendanceChange,
  isLocked = false,
}: AttendanceCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleDayClick = (date: Date) => {
    const dateKey = format(date, "yyyy-MM-dd");
    const isArchived = archivedDates.includes(dateKey);

    // Archived dates are ALWAYS locked
    if (isArchived) return;

    // Always allow clicking on days (no session limit lock)
    setSelectedDate(date);
    setIsDialogOpen(true);
  };

  const handleStatusSelect = (
    status: "present" | "absent" | "consulting" | null,
  ) => {
    if (selectedDate) {
      onAttendanceChange(selectedDate, status);
      setIsDialogOpen(false);
    }
  };

  // Custom DayContent to show indicators
  const DayContent = ({ date }: { date: Date }) => {
    const dateKey = format(date, "yyyy-MM-dd");
    const status = attendance[dateKey];
    const isArchived = archivedDates.includes(dateKey);

    return (
      <div
        className={cn(
          "relative w-full h-full flex items-center justify-center p-2 pointer-events-none",
          isArchived && "opacity-40 bg-slate-100 cursor-not-allowed grayscale",
        )}
      >
        <span className={isArchived ? "font-normal" : ""}>
          {date.getDate()}
        </span>
        {status === "present" && (
          <div className="absolute bottom-1 right-1">
            <Check
              className={cn(
                "w-3 h-3 text-green-600",
                isArchived && "text-slate-500",
              )}
              strokeWidth={4}
            />
          </div>
        )}
        {status === "absent" && (
          <div className="absolute bottom-1 right-1">
            <X
              className={cn(
                "w-3 h-3 text-red-600",
                isArchived && "text-slate-500",
              )}
              strokeWidth={4}
            />
          </div>
        )}
        {status === "consulting" && (
          <div className="absolute bottom-1 right-1">
            <ConsultingIcon
              className={cn(
                "w-4 h-4 text-purple-600",
                isArchived && "text-slate-500",
              )}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="flex justify-center border rounded-md p-4 bg-card text-card-foreground shadow-sm">
        <Calendar
          mode="single"
          selected={selectedDate}
          onDayClick={handleDayClick}
          components={{
            DayContent: DayContent,
          }}
          className="rounded-md border"
        />
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[320px]">
          <DialogHeader>
            <DialogTitle className="text-center">
              {selectedDate
                ? format(selectedDate, "MMMM d, yyyy")
                : "Select Date"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex justify-center gap-3 py-4 flex-wrap">
            <Button
              variant={
                attendance[
                  selectedDate ? format(selectedDate, "yyyy-MM-dd") : ""
                ] === "present"
                  ? "default"
                  : "outline"
              }
              className={cn(
                "flex flex-col h-20 w-20 gap-2",
                attendance[
                  selectedDate ? format(selectedDate, "yyyy-MM-dd") : ""
                ] === "present" && "bg-green-600 hover:bg-green-700",
              )}
              onClick={() => handleStatusSelect("present")}
            >
              <Check className="w-8 h-8" />
              <span>Present</span>
            </Button>
            <Button
              variant={
                attendance[
                  selectedDate ? format(selectedDate, "yyyy-MM-dd") : ""
                ] === "absent"
                  ? "default"
                  : "outline"
              }
              className={cn(
                "flex flex-col h-20 w-20 gap-2",
                attendance[
                  selectedDate ? format(selectedDate, "yyyy-MM-dd") : ""
                ] === "absent" && "bg-red-600 hover:bg-red-700",
              )}
              onClick={() => handleStatusSelect("absent")}
            >
              <X className="w-8 h-8" />
              <span>Absent</span>
            </Button>
            <Button
              variant={
                attendance[
                  selectedDate ? format(selectedDate, "yyyy-MM-dd") : ""
                ] === "consulting"
                  ? "default"
                  : "outline"
              }
              className={cn(
                "flex flex-col h-20 w-20 gap-2",
                attendance[
                  selectedDate ? format(selectedDate, "yyyy-MM-dd") : ""
                ] === "consulting" && "bg-purple-600 hover:bg-purple-700",
              )}
              onClick={() => handleStatusSelect("consulting")}
            >
              <ConsultingIcon className="w-8 h-8" />
              <span>Consulting</span>
            </Button>
          </div>
          <DialogFooter className="sm:justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleStatusSelect(null)}
            >
              <CircleSlash className="w-4 h-4 mr-2" />
              Clear Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
