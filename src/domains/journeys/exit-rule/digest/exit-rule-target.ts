import * as text from "../../../../kit/text.js";

/** Where a exit rule target is in its life cycle. */
export type ExitRuleTargetStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One exit rule target, with what the planners need to act on it. */
export class ExitRuleTarget {
  code: string;
  name: string;
  region: string;
  discount: number;
  priority: number;
  sequence: number;
  attempts: number;
  timezone: string;
  margin: number;
  batchSize: number;
  limit: number;
  status: ExitRuleTargetStatus;

  constructor(
    code: string,
    name: string,
    region: string,
    discount: number,
    priority: number,
    sequence: number,
    attempts: number,
    timezone: string,
    margin: number,
    batchSize: number,
    limit: number,
    status: ExitRuleTargetStatus,
  ) {
    this.code = code;
    this.name = name;
    this.region = region;
    this.discount = discount;
    this.priority = priority;
    this.sequence = sequence;
    this.attempts = attempts;
    this.timezone = timezone;
    this.margin = margin;
    this.batchSize = batchSize;
    this.limit = limit;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: ExitRuleTargetStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "active" || next === "suspended";
      case "pending":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ExitRuleTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`exit rule target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"exit rule target"} ${this.code}`;
  }

  weightedVolume(): number {
    return Math.round((this.margin + this.priority) * 100) / 100;
  }

  copy(): ExitRuleTarget {
    return new ExitRuleTarget(
      this.code,
      this.name,
      this.region,
      this.discount,
      this.priority,
      this.sequence,
      this.attempts,
      this.timezone,
      this.margin,
      this.batchSize,
      this.limit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a exit rule target in status draft. */
export function newExitRuleTarget(code: string, name: string): ExitRuleTarget {
  return new ExitRuleTarget(code, name, "", 0, 0, 0, 0, "", 0, 0, 0, "draft");
}
