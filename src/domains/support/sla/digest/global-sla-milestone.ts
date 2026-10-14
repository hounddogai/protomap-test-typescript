import * as text from "../../../../kit/text.js";

/** Where a global sla milestone is in its life cycle. */
export type GlobalSlaMilestoneStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One global sla milestone, with what the planners need to act on it. */
export class GlobalSlaMilestone {
  code: string;
  label: string;
  score: number;
  channel: string;
  contactEmail: string;
  phone: string;
  batchSize: number;
  status: GlobalSlaMilestoneStatus;

  constructor(
    code: string,
    label: string,
    score: number,
    channel: string,
    contactEmail: string,
    phone: string,
    batchSize: number,
    status: GlobalSlaMilestoneStatus,
  ) {
    this.code = code;
    this.label = label;
    this.score = score;
    this.channel = channel;
    this.contactEmail = contactEmail;
    this.phone = phone;
    this.batchSize = batchSize;
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

  canMoveTo(next: GlobalSlaMilestoneStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress";
      case "scheduled":
        return next === "cancelled";
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: GlobalSlaMilestoneStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global sla milestone ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  weightedVolume(): number {
    return Math.round((this.batchSize + this.score) * 100) / 100;
  }

  copy(): GlobalSlaMilestone {
    return new GlobalSlaMilestone(
      this.code,
      this.label,
      this.score,
      this.channel,
      this.contactEmail,
      this.phone,
      this.batchSize,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a global sla milestone in status planned. */
export function newGlobalSlaMilestone(code: string, label: string): GlobalSlaMilestone {
  return new GlobalSlaMilestone(code, label, 0, "", "", "", 0, "planned");
}
