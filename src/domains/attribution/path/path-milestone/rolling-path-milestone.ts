/**
 * The rolling path milestone records of attribution's path work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a rolling path milestone is in its life cycle. */
export type RollingPathMilestoneStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A rolling path milestone. Its code is unique within a tenant. */
export class RollingPathMilestone {
  code: string;
  label: string;
  category: string;
  channel: string;
  approved: boolean;
  summary: string;
  archived: boolean;
  ceiling: number;
  utmSource: string;
  maximum: number;
  limit: number;
  status: RollingPathMilestoneStatus;

  constructor(
    code: string,
    label: string,
    category: string,
    channel: string,
    approved: boolean,
    summary: string,
    archived: boolean,
    ceiling: number,
    utmSource: string,
    maximum: number,
    limit: number,
    status: RollingPathMilestoneStatus,
  ) {
    this.code = code;
    this.label = label;
    this.category = category;
    this.channel = channel;
    this.approved = approved;
    this.summary = summary;
    this.archived = archived;
    this.ceiling = ceiling;
    this.utmSource = utmSource;
    this.maximum = maximum;
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

  canMoveTo(next: RollingPathMilestoneStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: RollingPathMilestoneStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling path milestone ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  effectiveVolume(): number {
    return Math.round((this.maximum - this.ceiling) * 100) / 100;
  }

  copy(): RollingPathMilestone {
    return new RollingPathMilestone(
      this.code,
      this.label,
      this.category,
      this.channel,
      this.approved,
      this.summary,
      this.archived,
      this.ceiling,
      this.utmSource,
      this.maximum,
      this.limit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a rolling path milestone in status proposed. */
export function newRollingPathMilestone(code: string, label: string): RollingPathMilestone {
  return new RollingPathMilestone(code, label, "", "", false, "", false, 0, "", 0, 0, "proposed");
}
