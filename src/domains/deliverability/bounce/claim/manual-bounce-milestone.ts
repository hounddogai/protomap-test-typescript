import * as text from "../../../../kit/text.js";

/** Where a manual bounce milestone is in its life cycle. */
export type ManualBounceMilestoneStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a manual bounce milestone and its current status. */
export class ManualBounceMilestone {
  code: string;
  title: string;
  startsAt: number;
  cost: number;
  openRate: number;
  tags: string[];
  currency: string;
  status: ManualBounceMilestoneStatus;

  constructor(
    code: string,
    title: string,
    startsAt: number,
    cost: number,
    openRate: number,
    tags: string[],
    currency: string,
    status: ManualBounceMilestoneStatus,
  ) {
    this.code = code;
    this.title = title;
    this.startsAt = startsAt;
    this.cost = cost;
    this.openRate = openRate;
    this.tags = tags;
    this.currency = currency;
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

  canMoveTo(next: ManualBounceMilestoneStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming" || next === "draining";
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
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: ManualBounceMilestoneStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual bounce milestone ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  adjustedExposure(): number {
    return Math.round((this.cost + this.openRate) * 100) / 100;
  }

  copy(): ManualBounceMilestone {
    return new ManualBounceMilestone(
      this.code,
      this.title,
      this.startsAt,
      this.cost,
      this.openRate,
      this.tags,
      this.currency,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a manual bounce milestone in status idle. */
export function newManualBounceMilestone(code: string, title: string): ManualBounceMilestone {
  return new ManualBounceMilestone(code, title, 0, 0, 0, [], "", "idle");
}
