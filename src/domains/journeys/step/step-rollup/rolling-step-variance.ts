import * as text from "../../../../kit/text.js";

/** Where a rolling step variance is in its life cycle. */
export type RollingStepVarianceStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A rolling step variance. Its code is unique within a tenant. */
export class RollingStepVariance {
  code: string;
  label: string;
  openRate: number;
  reviewer: string;
  timezone: string;
  budget: number;
  description: string;
  status: RollingStepVarianceStatus;

  constructor(
    code: string,
    label: string,
    openRate: number,
    reviewer: string,
    timezone: string,
    budget: number,
    description: string,
    status: RollingStepVarianceStatus,
  ) {
    this.code = code;
    this.label = label;
    this.openRate = openRate;
    this.reviewer = reviewer;
    this.timezone = timezone;
    this.budget = budget;
    this.description = description;
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

  canMoveTo(next: RollingStepVarianceStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
            return true;
        }
        return false;
      case "warming":
        return next === "ready";
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: RollingStepVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling step variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  netLoad(): number {
    return Math.round((this.openRate - this.budget) * 100) / 100;
  }

  copy(): RollingStepVariance {
    return new RollingStepVariance(
      this.code,
      this.label,
      this.openRate,
      this.reviewer,
      this.timezone,
      this.budget,
      this.description,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a rolling step variance in status idle. */
export function newRollingStepVariance(code: string, label: string): RollingStepVariance {
  return new RollingStepVariance(code, label, 0, "", "", 0, "", "idle");
}
