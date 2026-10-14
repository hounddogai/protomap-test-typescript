import * as text from "../../../../kit/text.js";

/** Where a capped frequency entry is in its life cycle. */
export type CappedFrequencyEntryStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A capped frequency entry. Its code is unique within a tenant. */
export class CappedFrequencyEntry {
  code: string;
  name: string;
  locale: string;
  amount: number;
  notes: string;
  windowDays: number;
  budget: number;
  priority: number;
  source: string;
  status: CappedFrequencyEntryStatus;

  constructor(
    code: string,
    name: string,
    locale: string,
    amount: number,
    notes: string,
    windowDays: number,
    budget: number,
    priority: number,
    source: string,
    status: CappedFrequencyEntryStatus,
  ) {
    this.code = code;
    this.name = name;
    this.locale = locale;
    this.amount = amount;
    this.notes = notes;
    this.windowDays = windowDays;
    this.budget = budget;
    this.priority = priority;
    this.source = source;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: CappedFrequencyEntryStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "draining";
      case "warming":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: CappedFrequencyEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped frequency entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"capped frequency entry"} ${this.code}`;
  }

  adjustedTotal(): number {
    return Math.round((this.priority + this.windowDays) * 100) / 100;
  }

  copy(): CappedFrequencyEntry {
    return new CappedFrequencyEntry(
      this.code,
      this.name,
      this.locale,
      this.amount,
      this.notes,
      this.windowDays,
      this.budget,
      this.priority,
      this.source,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a capped frequency entry in status idle. */
export function newCappedFrequencyEntry(code: string, name: string): CappedFrequencyEntry {
  return new CappedFrequencyEntry(code, name, "", 0, "", 0, 0, 0, "", "idle");
}
