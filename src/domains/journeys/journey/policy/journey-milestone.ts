import * as text from "../../../../kit/text.js";

/** Where a journey milestone is in its life cycle. */
export type JourneyMilestoneStatus = "created" | "validated" | "published" | "retired";

/** The record of a journey milestone and its current status. */
export class JourneyMilestone {
  code: string;
  title: string;
  cohort: string;
  channel: string;
  sequence: number;
  status: JourneyMilestoneStatus;

  constructor(
    code: string,
    title: string,
    cohort: string,
    channel: string,
    sequence: number,
    status: JourneyMilestoneStatus,
  ) {
    this.code = code;
    this.title = title;
    this.cohort = cohort;
    this.channel = channel;
    this.sequence = sequence;
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

  canMoveTo(next: JourneyMilestoneStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published";
      case "validated":
        return next === "published";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: JourneyMilestoneStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`journey milestone ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  measuredValue(): number {
    return this.sequence;
  }

  copy(): JourneyMilestone {
    return new JourneyMilestone(this.code, this.title, this.cohort, this.channel, this.sequence, this.status);
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a journey milestone in status created. */
export function newJourneyMilestone(code: string, title: string): JourneyMilestone {
  return new JourneyMilestone(code, title, "", "", 0, "created");
}
