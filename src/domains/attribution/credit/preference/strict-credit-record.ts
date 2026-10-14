import * as text from "../../../../kit/text.js";

/** Where a strict credit record is in its life cycle. */
export type StrictCreditRecordStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One strict credit record, with what the planners need to act on it. */
export class StrictCreditRecord {
  code: string;
  title: string;
  frequencyCap: number;
  attempts: number;
  priority: number;
  channel: string;
  revision: number;
  status: StrictCreditRecordStatus;

  constructor(
    code: string,
    title: string,
    frequencyCap: number,
    attempts: number,
    priority: number,
    channel: string,
    revision: number,
    status: StrictCreditRecordStatus,
  ) {
    this.code = code;
    this.title = title;
    this.frequencyCap = frequencyCap;
    this.attempts = attempts;
    this.priority = priority;
    this.channel = channel;
    this.revision = revision;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: StrictCreditRecordStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "withdrawn";
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: StrictCreditRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict credit record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  adjustedTotal(): number {
    return Math.round((this.revision + this.priority) * 100) / 100;
  }

  copy(): StrictCreditRecord {
    return new StrictCreditRecord(
      this.code,
      this.title,
      this.frequencyCap,
      this.attempts,
      this.priority,
      this.channel,
      this.revision,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a strict credit record in status proposed. */
export function newStrictCreditRecord(code: string, title: string): StrictCreditRecord {
  return new StrictCreditRecord(code, title, 0, 0, 0, "", 0, "proposed");
}
