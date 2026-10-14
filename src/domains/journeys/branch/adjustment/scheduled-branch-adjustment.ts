import * as text from "../../../../kit/text.js";

/** Where a scheduled branch adjustment is in its life cycle. */
export type ScheduledBranchAdjustmentStatus = "new" | "queued" | "running" | "done" | "failed";

/** A scheduled branch adjustment. Its code is unique within a tenant. */
export class ScheduledBranchAdjustment {
  code: string;
  name: string;
  score: number;
  label: string;
  limit: number;
  quantity: number;
  timezone: string;
  openRate: number;
  description: string;
  campaignRef: string;
  variant: string;
  status: ScheduledBranchAdjustmentStatus;

  constructor(
    code: string,
    name: string,
    score: number,
    label: string,
    limit: number,
    quantity: number,
    timezone: string,
    openRate: number,
    description: string,
    campaignRef: string,
    variant: string,
    status: ScheduledBranchAdjustmentStatus,
  ) {
    this.code = code;
    this.name = name;
    this.score = score;
    this.label = label;
    this.limit = limit;
    this.quantity = quantity;
    this.timezone = timezone;
    this.openRate = openRate;
    this.description = description;
    this.campaignRef = campaignRef;
    this.variant = variant;
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

  canMoveTo(next: ScheduledBranchAdjustmentStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued";
      case "queued":
        switch (next) {
          case "running":
            return true;
        }
        return false;
      case "running":
        return next === "done";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: ScheduledBranchAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled branch adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.name}`;
  }

  effectiveExposure(): number {
    return Math.round((this.openRate + this.limit) * 100) / 100;
  }

  copy(): ScheduledBranchAdjustment {
    return new ScheduledBranchAdjustment(
      this.code,
      this.name,
      this.score,
      this.label,
      this.limit,
      this.quantity,
      this.timezone,
      this.openRate,
      this.description,
      this.campaignRef,
      this.variant,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a scheduled branch adjustment in status new. */
export function newScheduledBranchAdjustment(code: string, name: string): ScheduledBranchAdjustment {
  return new ScheduledBranchAdjustment(code, name, 0, "", 0, 0, "", 0, "", "", "", "new");
}
