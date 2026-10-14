/**
 * The approval rollup records of social's approval work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a approval rollup is in its life cycle. */
export type ApprovalRollupStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A approval rollup as the approval team keeps it. */
export class ApprovalRollup {
  code: string;
  label: string;
  budget: number;
  ratio: number;
  version: number;
  visible: boolean;
  status: ApprovalRollupStatus;

  constructor(
    code: string,
    label: string,
    budget: number,
    ratio: number,
    version: number,
    visible: boolean,
    status: ApprovalRollupStatus,
  ) {
    this.code = code;
    this.label = label;
    this.budget = budget;
    this.ratio = ratio;
    this.version = version;
    this.visible = visible;
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

  canMoveTo(next: ApprovalRollupStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        return next === "stopped";
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ApprovalRollupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`approval rollup ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  projectedExposure(): number {
    return Math.round((this.ratio + this.budget) * 100) / 100;
  }

  copy(): ApprovalRollup {
    return new ApprovalRollup(this.code, this.label, this.budget, this.ratio, this.version, this.visible, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a approval rollup in status idle. */
export function newApprovalRollup(code: string, label: string): ApprovalRollup {
  return new ApprovalRollup(code, label, 0, 0, 0, false, "idle");
}
