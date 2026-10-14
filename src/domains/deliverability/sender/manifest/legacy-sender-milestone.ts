import * as text from "../../../../kit/text.js";

/** Where a legacy sender milestone is in its life cycle. */
export type LegacySenderMilestoneStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a legacy sender milestone and its current status. */
export class LegacySenderMilestone {
  code: string;
  label: string;
  floorValue: number;
  margin: number;
  cohort: string;
  visible: boolean;
  status: LegacySenderMilestoneStatus;

  constructor(
    code: string,
    label: string,
    floorValue: number,
    margin: number,
    cohort: string,
    visible: boolean,
    status: LegacySenderMilestoneStatus,
  ) {
    this.code = code;
    this.label = label;
    this.floorValue = floorValue;
    this.margin = margin;
    this.cohort = cohort;
    this.visible = visible;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: LegacySenderMilestoneStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "suspended";
      case "pending":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "active":
        return next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: LegacySenderMilestoneStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy sender milestone ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  weightedTotal(): number {
    return Math.round((this.floorValue + this.margin) * 100) / 100;
  }

  copy(): LegacySenderMilestone {
    return new LegacySenderMilestone(
      this.code,
      this.label,
      this.floorValue,
      this.margin,
      this.cohort,
      this.visible,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a legacy sender milestone in status draft. */
export function newLegacySenderMilestone(code: string, label: string): LegacySenderMilestone {
  return new LegacySenderMilestone(code, label, 0, 0, "", false, "draft");
}
