import * as text from "../../../../kit/text.js";

/** Where a capped nudge entry is in its life cycle. */
export type CappedNudgeEntryStatus = "created" | "validated" | "published" | "retired";

/** One capped nudge entry, with what the planners need to act on it. */
export class CappedNudgeEntry {
  code: string;
  label: string;
  country: string;
  threshold: number;
  archived: boolean;
  windowDays: number;
  channel: string;
  retries: number;
  approved: boolean;
  status: CappedNudgeEntryStatus;

  constructor(
    code: string,
    label: string,
    country: string,
    threshold: number,
    archived: boolean,
    windowDays: number,
    channel: string,
    retries: number,
    approved: boolean,
    status: CappedNudgeEntryStatus,
  ) {
    this.code = code;
    this.label = label;
    this.country = country;
    this.threshold = threshold;
    this.archived = archived;
    this.windowDays = windowDays;
    this.channel = channel;
    this.retries = retries;
    this.approved = approved;
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

  canMoveTo(next: CappedNudgeEntryStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published" || next === "retired";
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CappedNudgeEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped nudge entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  effectiveLoad(): number {
    return Math.round((this.retries + this.windowDays) * 100) / 100;
  }

  copy(): CappedNudgeEntry {
    return new CappedNudgeEntry(
      this.code,
      this.label,
      this.country,
      this.threshold,
      this.archived,
      this.windowDays,
      this.channel,
      this.retries,
      this.approved,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a capped nudge entry in status created. */
export function newCappedNudgeEntry(code: string, label: string): CappedNudgeEntry {
  return new CappedNudgeEntry(code, label, "", 0, false, 0, "", 0, false, "created");
}
