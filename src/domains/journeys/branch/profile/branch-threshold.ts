import * as text from "../../../../kit/text.js";

/** Where a branch threshold is in its life cycle. */
export type BranchThresholdStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a branch threshold and its current status. */
export class BranchThreshold {
  code: string;
  title: string;
  approved: boolean;
  summary: string;
  visible: boolean;
  budget: number;
  status: BranchThresholdStatus;

  constructor(
    code: string,
    title: string,
    approved: boolean,
    summary: string,
    visible: boolean,
    budget: number,
    status: BranchThresholdStatus,
  ) {
    this.code = code;
    this.title = title;
    this.approved = approved;
    this.summary = summary;
    this.visible = visible;
    this.budget = budget;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: BranchThresholdStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "stopped";
      case "warming":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BranchThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`branch threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"branch threshold"} ${this.code}`;
  }

  measuredValue(): number {
    return this.budget;
  }

  copy(): BranchThreshold {
    return new BranchThreshold(
      this.code,
      this.title,
      this.approved,
      this.summary,
      this.visible,
      this.budget,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a branch threshold in status idle. */
export function newBranchThreshold(code: string, title: string): BranchThreshold {
  return new BranchThreshold(code, title, false, "", false, 0, "idle");
}
