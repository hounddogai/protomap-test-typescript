import * as text from "../../../../kit/text.js";

/** Where a pacing milestone is in its life cycle. */
export type PacingMilestoneStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One pacing milestone, with what the planners need to act on it. */
export class PacingMilestone {
  code: string;
  name: string;
  budget: number;
  ownerId: string;
  variant: string;
  channel: string;
  segment: string;
  active: boolean;
  graceDays: number;
  rate: number;
  status: PacingMilestoneStatus;

  constructor(
    code: string,
    name: string,
    budget: number,
    ownerId: string,
    variant: string,
    channel: string,
    segment: string,
    active: boolean,
    graceDays: number,
    rate: number,
    status: PacingMilestoneStatus,
  ) {
    this.code = code;
    this.name = name;
    this.budget = budget;
    this.ownerId = ownerId;
    this.variant = variant;
    this.channel = channel;
    this.segment = segment;
    this.active = active;
    this.graceDays = graceDays;
    this.rate = rate;
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

  canMoveTo(next: PacingMilestoneStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected" || next === "withdrawn";
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: PacingMilestoneStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pacing milestone ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  weightedTotal(): number {
    return Math.round(this.rate * this.budget * 100) / 100;
  }

  copy(): PacingMilestone {
    return new PacingMilestone(
      this.code,
      this.name,
      this.budget,
      this.ownerId,
      this.variant,
      this.channel,
      this.segment,
      this.active,
      this.graceDays,
      this.rate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a pacing milestone in status proposed. */
export function newPacingMilestone(code: string, name: string): PacingMilestone {
  return new PacingMilestone(code, name, 0, "", "", "", "", false, 0, 0, "proposed");
}
