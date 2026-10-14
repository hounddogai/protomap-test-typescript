import * as text from "../../../../kit/text.js";

/** Where a global branch milestone is in its life cycle. */
export type GlobalBranchMilestoneStatus = "new" | "queued" | "running" | "done" | "failed";

/** One global branch milestone, with what the planners need to act on it. */
export class GlobalBranchMilestone {
  code: string;
  label: string;
  visible: boolean;
  amount: number;
  campaignRef: string;
  impressions: number;
  title: string;
  status: GlobalBranchMilestoneStatus;

  constructor(
    code: string,
    label: string,
    visible: boolean,
    amount: number,
    campaignRef: string,
    impressions: number,
    title: string,
    status: GlobalBranchMilestoneStatus,
  ) {
    this.code = code;
    this.label = label;
    this.visible = visible;
    this.amount = amount;
    this.campaignRef = campaignRef;
    this.impressions = impressions;
    this.title = title;
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

  canMoveTo(next: GlobalBranchMilestoneStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "queued":
        return next === "running" || next === "done";
      case "running":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: GlobalBranchMilestoneStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global branch milestone ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  projectedValue(): number {
    return Math.round(this.impressions * this.amount * 100) / 100;
  }

  copy(): GlobalBranchMilestone {
    return new GlobalBranchMilestone(
      this.code,
      this.label,
      this.visible,
      this.amount,
      this.campaignRef,
      this.impressions,
      this.title,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a global branch milestone in status new. */
export function newGlobalBranchMilestone(code: string, label: string): GlobalBranchMilestone {
  return new GlobalBranchMilestone(code, label, false, 0, "", 0, "", "new");
}
