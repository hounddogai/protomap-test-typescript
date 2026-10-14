import * as text from "../../../../kit/text.js";

/** Where a branch milestone is in its life cycle. */
export type BranchMilestoneStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One branch milestone, with what the planners need to act on it. */
export class BranchMilestone {
  code: string;
  title: string;
  startsAt: number;
  sendAt: number;
  attributes: Map<string, string>;
  status: BranchMilestoneStatus;

  constructor(
    code: string,
    title: string,
    startsAt: number,
    sendAt: number,
    attributes: Map<string, string>,
    status: BranchMilestoneStatus,
  ) {
    this.code = code;
    this.title = title;
    this.startsAt = startsAt;
    this.sendAt = sendAt;
    this.attributes = attributes;
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

  canMoveTo(next: BranchMilestoneStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "rejected";
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: BranchMilestoneStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`branch milestone ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"branch milestone"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  netTotal(): number {
    return Math.round((this.startsAt - this.sendAt) * 100) / 100;
  }

  copy(): BranchMilestone {
    return new BranchMilestone(this.code, this.title, this.startsAt, this.sendAt, this.attributes, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a branch milestone in status proposed. */
export function newBranchMilestone(code: string, title: string): BranchMilestone {
  return new BranchMilestone(code, title, 0, 0, new Map<string, string>(), "proposed");
}
