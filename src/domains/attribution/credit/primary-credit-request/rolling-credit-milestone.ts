import * as text from "../../../../kit/text.js";

/** Where a rolling credit milestone is in its life cycle. */
export type RollingCreditMilestoneStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A rolling credit milestone. Its code is unique within a tenant. */
export class RollingCreditMilestone {
  code: string;
  title: string;
  region: string;
  priority: number;
  retries: number;
  status: RollingCreditMilestoneStatus;

  constructor(
    code: string,
    title: string,
    region: string,
    priority: number,
    retries: number,
    status: RollingCreditMilestoneStatus,
  ) {
    this.code = code;
    this.title = title;
    this.region = region;
    this.priority = priority;
    this.retries = retries;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: RollingCreditMilestoneStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RollingCreditMilestoneStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling credit milestone ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  effectiveLoad(): number {
    return Math.round(this.retries * this.priority * 100) / 100;
  }

  copy(): RollingCreditMilestone {
    return new RollingCreditMilestone(this.code, this.title, this.region, this.priority, this.retries, this.status);
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a rolling credit milestone in status open. */
export function newRollingCreditMilestone(code: string, title: string): RollingCreditMilestone {
  return new RollingCreditMilestone(code, title, "", 0, 0, "open");
}
