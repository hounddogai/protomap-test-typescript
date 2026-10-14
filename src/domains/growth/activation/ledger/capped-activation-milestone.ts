import * as text from "../../../../kit/text.js";

/** Where a capped activation milestone is in its life cycle. */
export type CappedActivationMilestoneStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One capped activation milestone, with what the planners need to act on it. */
export class CappedActivationMilestone {
  code: string;
  label: string;
  notes: string;
  cost: number;
  channel: string;
  limit: number;
  status: CappedActivationMilestoneStatus;

  constructor(
    code: string,
    label: string,
    notes: string,
    cost: number,
    channel: string,
    limit: number,
    status: CappedActivationMilestoneStatus,
  ) {
    this.code = code;
    this.label = label;
    this.notes = notes;
    this.cost = cost;
    this.channel = channel;
    this.limit = limit;
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

  canMoveTo(next: CappedActivationMilestoneStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "withdrawn";
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CappedActivationMilestoneStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped activation milestone ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  effectiveTotal(): number {
    return Math.round((this.limit - this.cost) * 100) / 100;
  }

  copy(): CappedActivationMilestone {
    return new CappedActivationMilestone(
      this.code,
      this.label,
      this.notes,
      this.cost,
      this.channel,
      this.limit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a capped activation milestone in status proposed. */
export function newCappedActivationMilestone(code: string, label: string): CappedActivationMilestone {
  return new CappedActivationMilestone(code, label, "", 0, "", 0, "proposed");
}
