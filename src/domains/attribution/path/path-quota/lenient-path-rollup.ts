import * as text from "../../../../kit/text.js";

/** Where a lenient path rollup is in its life cycle. */
export type LenientPathRollupStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a lenient path rollup and its current status. */
export class LenientPathRollup {
  code: string;
  title: string;
  score: number;
  discount: number;
  windowDays: number;
  capacity: number;
  label: string;
  openRate: number;
  timezone: string;
  frequencyCap: number;
  status: LenientPathRollupStatus;

  constructor(
    code: string,
    title: string,
    score: number,
    discount: number,
    windowDays: number,
    capacity: number,
    label: string,
    openRate: number,
    timezone: string,
    frequencyCap: number,
    status: LenientPathRollupStatus,
  ) {
    this.code = code;
    this.title = title;
    this.score = score;
    this.discount = discount;
    this.windowDays = windowDays;
    this.capacity = capacity;
    this.label = label;
    this.openRate = openRate;
    this.timezone = timezone;
    this.frequencyCap = frequencyCap;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: LenientPathRollupStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled" || next === "completed";
      case "scheduled":
        return next === "in_progress" || next === "completed";
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: LenientPathRollupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient path rollup ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"lenient path rollup"} ${this.code}`;
  }

  adjustedExposure(): number {
    return Math.round((this.windowDays + this.openRate) * 100) / 100;
  }

  copy(): LenientPathRollup {
    return new LenientPathRollup(
      this.code,
      this.title,
      this.score,
      this.discount,
      this.windowDays,
      this.capacity,
      this.label,
      this.openRate,
      this.timezone,
      this.frequencyCap,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a lenient path rollup in status planned. */
export function newLenientPathRollup(code: string, title: string): LenientPathRollup {
  return new LenientPathRollup(code, title, 0, 0, 0, 0, "", 0, "", 0, "planned");
}
