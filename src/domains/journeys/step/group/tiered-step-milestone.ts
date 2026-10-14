import * as text from "../../../../kit/text.js";

/** Where a tiered step milestone is in its life cycle. */
export type TieredStepMilestoneStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a tiered step milestone and its current status. */
export class TieredStepMilestone {
  code: string;
  title: string;
  quantity: number;
  priority: number;
  segment: string;
  updatedAt: number;
  status: TieredStepMilestoneStatus;

  constructor(
    code: string,
    title: string,
    quantity: number,
    priority: number,
    segment: string,
    updatedAt: number,
    status: TieredStepMilestoneStatus,
  ) {
    this.code = code;
    this.title = title;
    this.quantity = quantity;
    this.priority = priority;
    this.segment = segment;
    this.updatedAt = updatedAt;
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

  canMoveTo(next: TieredStepMilestoneStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "ready" || next === "draining";
      case "warming":
        return next === "draining";
      case "ready":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: TieredStepMilestoneStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered step milestone ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  adjustedExposure(): number {
    return Math.round((this.updatedAt + this.quantity) * 100) / 100;
  }

  copy(): TieredStepMilestone {
    return new TieredStepMilestone(
      this.code,
      this.title,
      this.quantity,
      this.priority,
      this.segment,
      this.updatedAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a tiered step milestone in status idle. */
export function newTieredStepMilestone(code: string, title: string): TieredStepMilestone {
  return new TieredStepMilestone(code, title, 0, 0, "", 0, "idle");
}
