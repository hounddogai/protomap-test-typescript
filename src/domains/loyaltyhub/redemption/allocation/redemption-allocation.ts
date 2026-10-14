/**
 * The redemption allocation records of loyaltyhub's redemption work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a redemption allocation is in its life cycle. */
export type RedemptionAllocationStatus = "new" | "queued" | "running" | "done" | "failed";

/** A redemption allocation. Its code is unique within a tenant. */
export class RedemptionAllocation {
  code: string;
  title: string;
  ratio: number;
  version: number;
  batchSize: number;
  limit: number;
  category: string;
  priority: number;
  currency: string;
  channel: string;
  status: RedemptionAllocationStatus;

  constructor(
    code: string,
    title: string,
    ratio: number,
    version: number,
    batchSize: number,
    limit: number,
    category: string,
    priority: number,
    currency: string,
    channel: string,
    status: RedemptionAllocationStatus,
  ) {
    this.code = code;
    this.title = title;
    this.ratio = ratio;
    this.version = version;
    this.batchSize = batchSize;
    this.limit = limit;
    this.category = category;
    this.priority = priority;
    this.currency = currency;
    this.channel = channel;
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

  canMoveTo(next: RedemptionAllocationStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued" || next === "running";
      case "queued":
        switch (next) {
          case "running":
          case "done":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: RedemptionAllocationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`redemption allocation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  netLoad(): number {
    return Math.round((this.version - this.priority) * 100) / 100;
  }

  copy(): RedemptionAllocation {
    return new RedemptionAllocation(
      this.code,
      this.title,
      this.ratio,
      this.version,
      this.batchSize,
      this.limit,
      this.category,
      this.priority,
      this.currency,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a redemption allocation in status new. */
export function newRedemptionAllocation(code: string, title: string): RedemptionAllocation {
  return new RedemptionAllocation(code, title, 0, 0, 0, 0, "", 0, "", "", "new");
}
