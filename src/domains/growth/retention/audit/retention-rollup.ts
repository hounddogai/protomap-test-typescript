import * as text from "../../../../kit/text.js";

/** Where a retention rollup is in its life cycle. */
export type RetentionRollupStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A retention rollup. Its code is unique within a tenant. */
export class RetentionRollup {
  code: string;
  name: string;
  cost: number;
  conversionRate: number;
  batchSize: number;
  status: RetentionRollupStatus;

  constructor(
    code: string,
    name: string,
    cost: number,
    conversionRate: number,
    batchSize: number,
    status: RetentionRollupStatus,
  ) {
    this.code = code;
    this.name = name;
    this.cost = cost;
    this.conversionRate = conversionRate;
    this.batchSize = batchSize;
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

  canMoveTo(next: RetentionRollupStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
          case "reopened":
            return true;
        }
        return false;
      case "in_review":
        return next === "resolved" || next === "reopened";
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RetentionRollupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`retention rollup ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  adjustedValue(): number {
    return Math.round(this.batchSize * this.conversionRate * 100) / 100;
  }

  copy(): RetentionRollup {
    return new RetentionRollup(this.code, this.name, this.cost, this.conversionRate, this.batchSize, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a retention rollup in status open. */
export function newRetentionRollup(code: string, name: string): RetentionRollup {
  return new RetentionRollup(code, name, 0, 0, 0, "open");
}
