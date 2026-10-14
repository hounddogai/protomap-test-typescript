import * as text from "../../../../kit/text.js";

/** Where a strict branch milestone is in its life cycle. */
export type StrictBranchMilestoneStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A strict branch milestone as the branch team keeps it. */
export class StrictBranchMilestone {
  code: string;
  name: string;
  segment: string;
  reviewer: string;
  locale: string;
  source: string;
  bid: number;
  threshold: number;
  externalRef: string;
  minimum: number;
  status: StrictBranchMilestoneStatus;

  constructor(
    code: string,
    name: string,
    segment: string,
    reviewer: string,
    locale: string,
    source: string,
    bid: number,
    threshold: number,
    externalRef: string,
    minimum: number,
    status: StrictBranchMilestoneStatus,
  ) {
    this.code = code;
    this.name = name;
    this.segment = segment;
    this.reviewer = reviewer;
    this.locale = locale;
    this.source = source;
    this.bid = bid;
    this.threshold = threshold;
    this.externalRef = externalRef;
    this.minimum = minimum;
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

  canMoveTo(next: StrictBranchMilestoneStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
          case "draining":
            return true;
        }
        return false;
      case "warming":
        return next === "draining";
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: StrictBranchMilestoneStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict branch milestone ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  projectedExposure(): number {
    return Math.round(this.threshold * this.bid * 100) / 100;
  }

  copy(): StrictBranchMilestone {
    return new StrictBranchMilestone(
      this.code,
      this.name,
      this.segment,
      this.reviewer,
      this.locale,
      this.source,
      this.bid,
      this.threshold,
      this.externalRef,
      this.minimum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a strict branch milestone in status idle. */
export function newStrictBranchMilestone(code: string, name: string): StrictBranchMilestone {
  return new StrictBranchMilestone(code, name, "", "", "", "", 0, 0, "", 0, "idle");
}
