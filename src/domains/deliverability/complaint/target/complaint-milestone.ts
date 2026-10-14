import * as text from "../../../../kit/text.js";

/** Where a complaint milestone is in its life cycle. */
export type ComplaintMilestoneStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A complaint milestone as the complaint team keeps it. */
export class ComplaintMilestone {
  code: string;
  name: string;
  visible: boolean;
  source: string;
  threshold: number;
  label: string;
  pinned: boolean;
  timezone: string;
  budget: number;
  status: ComplaintMilestoneStatus;

  constructor(
    code: string,
    name: string,
    visible: boolean,
    source: string,
    threshold: number,
    label: string,
    pinned: boolean,
    timezone: string,
    budget: number,
    status: ComplaintMilestoneStatus,
  ) {
    this.code = code;
    this.name = name;
    this.visible = visible;
    this.source = source;
    this.threshold = threshold;
    this.label = label;
    this.pinned = pinned;
    this.timezone = timezone;
    this.budget = budget;
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

  canMoveTo(next: ComplaintMilestoneStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "rejected";
      case "approved":
        return next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: ComplaintMilestoneStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`complaint milestone ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"complaint milestone"} ${this.code}`;
  }

  adjustedLoad(): number {
    return Math.round((this.threshold - this.budget) * 100) / 100;
  }

  copy(): ComplaintMilestone {
    return new ComplaintMilestone(
      this.code,
      this.name,
      this.visible,
      this.source,
      this.threshold,
      this.label,
      this.pinned,
      this.timezone,
      this.budget,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a complaint milestone in status proposed. */
export function newComplaintMilestone(code: string, name: string): ComplaintMilestone {
  return new ComplaintMilestone(code, name, false, "", 0, "", false, "", 0, "proposed");
}
