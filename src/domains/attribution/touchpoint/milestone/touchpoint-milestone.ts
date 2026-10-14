/**
 * The touchpoint milestone records of attribution's touchpoint work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a touchpoint milestone is in its life cycle. */
export type TouchpointMilestoneStatus = "created" | "validated" | "published" | "retired";

/** The record of a touchpoint milestone and its current status. */
export class TouchpointMilestone {
  code: string;
  label: string;
  limit: number;
  bid: number;
  journeyId: string;
  batchSize: number;
  openRate: number;
  summary: string;
  status: TouchpointMilestoneStatus;

  constructor(
    code: string,
    label: string,
    limit: number,
    bid: number,
    journeyId: string,
    batchSize: number,
    openRate: number,
    summary: string,
    status: TouchpointMilestoneStatus,
  ) {
    this.code = code;
    this.label = label;
    this.limit = limit;
    this.bid = bid;
    this.journeyId = journeyId;
    this.batchSize = batchSize;
    this.openRate = openRate;
    this.summary = summary;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: TouchpointMilestoneStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TouchpointMilestoneStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`touchpoint milestone ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"touchpoint milestone"} ${this.code}`;
  }

  weightedValue(): number {
    return Math.round(this.limit * this.bid * 100) / 100;
  }

  copy(): TouchpointMilestone {
    return new TouchpointMilestone(
      this.code,
      this.label,
      this.limit,
      this.bid,
      this.journeyId,
      this.batchSize,
      this.openRate,
      this.summary,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a touchpoint milestone in status created. */
export function newTouchpointMilestone(code: string, label: string): TouchpointMilestone {
  return new TouchpointMilestone(code, label, 0, 0, "", 0, 0, "", "created");
}
