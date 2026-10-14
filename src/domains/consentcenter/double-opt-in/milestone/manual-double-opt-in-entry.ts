import * as text from "../../../../kit/text.js";

/** Where a manual double opt in entry is in its life cycle. */
export type ManualDoubleOptInEntryStatus = "created" | "validated" | "published" | "retired";

/** One manual double opt in entry, with what the planners need to act on it. */
export class ManualDoubleOptInEntry {
  code: string;
  title: string;
  bid: number;
  externalRef: string;
  durationMinutes: number;
  windowDays: number;
  attempts: number;
  status: ManualDoubleOptInEntryStatus;

  constructor(
    code: string,
    title: string,
    bid: number,
    externalRef: string,
    durationMinutes: number,
    windowDays: number,
    attempts: number,
    status: ManualDoubleOptInEntryStatus,
  ) {
    this.code = code;
    this.title = title;
    this.bid = bid;
    this.externalRef = externalRef;
    this.durationMinutes = durationMinutes;
    this.windowDays = windowDays;
    this.attempts = attempts;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: ManualDoubleOptInEntryStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "validated":
        return next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: ManualDoubleOptInEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual double opt in entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"manual double opt in entry"} ${this.code}`;
  }

  weightedLoad(): number {
    return Math.round((this.bid - this.durationMinutes) * 100) / 100;
  }

  copy(): ManualDoubleOptInEntry {
    return new ManualDoubleOptInEntry(
      this.code,
      this.title,
      this.bid,
      this.externalRef,
      this.durationMinutes,
      this.windowDays,
      this.attempts,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a manual double opt in entry in status created. */
export function newManualDoubleOptInEntry(code: string, title: string): ManualDoubleOptInEntry {
  return new ManualDoubleOptInEntry(code, title, 0, "", 0, 0, 0, "created");
}
