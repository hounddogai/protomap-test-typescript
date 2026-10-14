/**
 * The lenient branch metric records of journeys's branch work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a lenient branch metric is in its life cycle. */
export type LenientBranchMetricStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A lenient branch metric. Its code is unique within a tenant. */
export class LenientBranchMetric {
  code: string;
  title: string;
  tags: string[];
  budget: number;
  cost: number;
  status: LenientBranchMetricStatus;

  constructor(
    code: string,
    title: string,
    tags: string[],
    budget: number,
    cost: number,
    status: LenientBranchMetricStatus,
  ) {
    this.code = code;
    this.title = title;
    this.tags = tags;
    this.budget = budget;
    this.cost = cost;
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

  canMoveTo(next: LenientBranchMetricStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending";
      case "pending":
        return next === "active" || next === "suspended";
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

  moveTo(next: LenientBranchMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient branch metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  weightedValue(): number {
    return Math.round((this.cost + this.budget) * 100) / 100;
  }

  copy(): LenientBranchMetric {
    return new LenientBranchMetric(this.code, this.title, this.tags, this.budget, this.cost, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a lenient branch metric in status draft. */
export function newLenientBranchMetric(code: string, title: string): LenientBranchMetric {
  return new LenientBranchMetric(code, title, [], 0, 0, "draft");
}
