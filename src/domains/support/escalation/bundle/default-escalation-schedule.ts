import * as text from "../../../../kit/text.js";

/** Where a default escalation schedule is in its life cycle. */
export type DefaultEscalationScheduleStatus = "new" | "queued" | "running" | "done" | "failed";

/** One default escalation schedule, with what the planners need to act on it. */
export class DefaultEscalationSchedule {
  code: string;
  title: string;
  rate: number;
  channel: string;
  notes: string;
  contactEmail: string;
  batchSize: number;
  status: DefaultEscalationScheduleStatus;

  constructor(
    code: string,
    title: string,
    rate: number,
    channel: string,
    notes: string,
    contactEmail: string,
    batchSize: number,
    status: DefaultEscalationScheduleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.rate = rate;
    this.channel = channel;
    this.notes = notes;
    this.contactEmail = contactEmail;
    this.batchSize = batchSize;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: DefaultEscalationScheduleStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "queued":
        return next === "failed";
      case "running":
        return next === "done" || next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: DefaultEscalationScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default escalation schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  effectiveValue(): number {
    return Math.round(this.rate * this.batchSize * 100) / 100;
  }

  copy(): DefaultEscalationSchedule {
    return new DefaultEscalationSchedule(
      this.code,
      this.title,
      this.rate,
      this.channel,
      this.notes,
      this.contactEmail,
      this.batchSize,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a default escalation schedule in status new. */
export function newDefaultEscalationSchedule(code: string, title: string): DefaultEscalationSchedule {
  return new DefaultEscalationSchedule(code, title, 0, "", "", "", 0, "new");
}
