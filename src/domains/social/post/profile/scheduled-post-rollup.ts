import * as text from "../../../../kit/text.js";

/** Where a scheduled post rollup is in its life cycle. */
export type ScheduledPostRollupStatus = "created" | "validated" | "published" | "retired";

/** A scheduled post rollup. Its code is unique within a tenant. */
export class ScheduledPostRollup {
  code: string;
  title: string;
  campaignRef: string;
  cost: number;
  timezone: string;
  threshold: number;
  status: ScheduledPostRollupStatus;

  constructor(
    code: string,
    title: string,
    campaignRef: string,
    cost: number,
    timezone: string,
    threshold: number,
    status: ScheduledPostRollupStatus,
  ) {
    this.code = code;
    this.title = title;
    this.campaignRef = campaignRef;
    this.cost = cost;
    this.timezone = timezone;
    this.threshold = threshold;
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

  canMoveTo(next: ScheduledPostRollupStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published" || next === "retired";
      case "validated":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: ScheduledPostRollupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled post rollup ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"scheduled post rollup"} ${this.code}`;
  }

  effectiveTotal(): number {
    return Math.round(this.cost * this.threshold * 100) / 100;
  }

  copy(): ScheduledPostRollup {
    return new ScheduledPostRollup(
      this.code,
      this.title,
      this.campaignRef,
      this.cost,
      this.timezone,
      this.threshold,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a scheduled post rollup in status created. */
export function newScheduledPostRollup(code: string, title: string): ScheduledPostRollup {
  return new ScheduledPostRollup(code, title, "", 0, "", 0, "created");
}
