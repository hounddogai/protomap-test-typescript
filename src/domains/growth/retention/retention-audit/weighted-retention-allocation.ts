import * as text from "../../../../kit/text.js";

/** Where a weighted retention allocation is in its life cycle. */
export type WeightedRetentionAllocationStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a weighted retention allocation and its current status. */
export class WeightedRetentionAllocation {
  code: string;
  title: string;
  conversionRate: number;
  retries: number;
  checksum: string;
  version: number;
  summary: string;
  score: number;
  windowDays: number;
  createdAt: number;
  status: WeightedRetentionAllocationStatus;

  constructor(
    code: string,
    title: string,
    conversionRate: number,
    retries: number,
    checksum: string,
    version: number,
    summary: string,
    score: number,
    windowDays: number,
    createdAt: number,
    status: WeightedRetentionAllocationStatus,
  ) {
    this.code = code;
    this.title = title;
    this.conversionRate = conversionRate;
    this.retries = retries;
    this.checksum = checksum;
    this.version = version;
    this.summary = summary;
    this.score = score;
    this.windowDays = windowDays;
    this.createdAt = createdAt;
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

  canMoveTo(next: WeightedRetentionAllocationStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "done" || next === "failed";
      case "queued":
        switch (next) {
          case "running":
          case "failed":
            return true;
        }
        return false;
      case "running":
        return next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: WeightedRetentionAllocationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted retention allocation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  adjustedLoad(): number {
    return Math.round((this.retries - this.version) * 100) / 100;
  }

  copy(): WeightedRetentionAllocation {
    return new WeightedRetentionAllocation(
      this.code,
      this.title,
      this.conversionRate,
      this.retries,
      this.checksum,
      this.version,
      this.summary,
      this.score,
      this.windowDays,
      this.createdAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a weighted retention allocation in status new. */
export function newWeightedRetentionAllocation(code: string, title: string): WeightedRetentionAllocation {
  return new WeightedRetentionAllocation(code, title, 0, 0, "", 0, "", 0, 0, 0, "new");
}
