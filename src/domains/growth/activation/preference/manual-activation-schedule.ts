import * as text from "../../../../kit/text.js";

/** Where a manual activation schedule is in its life cycle. */
export type ManualActivationScheduleStatus = "created" | "validated" | "published" | "retired";

/** A manual activation schedule. Its code is unique within a tenant. */
export class ManualActivationSchedule {
  code: string;
  title: string;
  summary: string;
  amount: number;
  frequencyCap: number;
  notes: string;
  impressions: number;
  segment: string;
  status: ManualActivationScheduleStatus;

  constructor(
    code: string,
    title: string,
    summary: string,
    amount: number,
    frequencyCap: number,
    notes: string,
    impressions: number,
    segment: string,
    status: ManualActivationScheduleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.summary = summary;
    this.amount = amount;
    this.frequencyCap = frequencyCap;
    this.notes = notes;
    this.impressions = impressions;
    this.segment = segment;
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

  canMoveTo(next: ManualActivationScheduleStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "published":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ManualActivationScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual activation schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"manual activation schedule"} ${this.code}`;
  }

  weightedValue(): number {
    return Math.round((this.impressions + this.amount) * 100) / 100;
  }

  copy(): ManualActivationSchedule {
    return new ManualActivationSchedule(
      this.code,
      this.title,
      this.summary,
      this.amount,
      this.frequencyCap,
      this.notes,
      this.impressions,
      this.segment,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a manual activation schedule in status created. */
export function newManualActivationSchedule(code: string, title: string): ManualActivationSchedule {
  return new ManualActivationSchedule(code, title, "", 0, 0, "", 0, "", "created");
}
