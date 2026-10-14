import * as text from "../../../../kit/text.js";

/** Where a rolling streak bundle is in its life cycle. */
export type RollingStreakBundleStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One rolling streak bundle, with what the planners need to act on it. */
export class RollingStreakBundle {
  code: string;
  label: string;
  name: string;
  budget: number;
  rate: number;
  limit: number;
  margin: number;
  reviewer: string;
  checksum: string;
  status: RollingStreakBundleStatus;

  constructor(
    code: string,
    label: string,
    name: string,
    budget: number,
    rate: number,
    limit: number,
    margin: number,
    reviewer: string,
    checksum: string,
    status: RollingStreakBundleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.name = name;
    this.budget = budget;
    this.rate = rate;
    this.limit = limit;
    this.margin = margin;
    this.reviewer = reviewer;
    this.checksum = checksum;
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

  canMoveTo(next: RollingStreakBundleStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
            return true;
        }
        return false;
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

  moveTo(next: RollingStreakBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling streak bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  adjustedVolume(): number {
    return Math.round((this.margin - this.budget) * 100) / 100;
  }

  copy(): RollingStreakBundle {
    return new RollingStreakBundle(
      this.code,
      this.label,
      this.name,
      this.budget,
      this.rate,
      this.limit,
      this.margin,
      this.reviewer,
      this.checksum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a rolling streak bundle in status idle. */
export function newRollingStreakBundle(code: string, label: string): RollingStreakBundle {
  return new RollingStreakBundle(code, label, "", 0, 0, 0, 0, "", "", "idle");
}
