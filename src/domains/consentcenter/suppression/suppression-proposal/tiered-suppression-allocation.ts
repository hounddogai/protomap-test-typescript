import * as text from "../../../../kit/text.js";

/** Where a tiered suppression allocation is in its life cycle. */
export type TieredSuppressionAllocationStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A tiered suppression allocation as the suppression team keeps it. */
export class TieredSuppressionAllocation {
  code: string;
  title: string;
  score: number;
  source: string;
  impressions: number;
  pinned: boolean;
  updatedAt: number;
  status: TieredSuppressionAllocationStatus;

  constructor(
    code: string,
    title: string,
    score: number,
    source: string,
    impressions: number,
    pinned: boolean,
    updatedAt: number,
    status: TieredSuppressionAllocationStatus,
  ) {
    this.code = code;
    this.title = title;
    this.score = score;
    this.source = source;
    this.impressions = impressions;
    this.pinned = pinned;
    this.updatedAt = updatedAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: TieredSuppressionAllocationStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        return next === "completed" || next === "cancelled";
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TieredSuppressionAllocationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered suppression allocation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  weightedLoad(): number {
    return Math.round(this.score * this.impressions * 100) / 100;
  }

  copy(): TieredSuppressionAllocation {
    return new TieredSuppressionAllocation(
      this.code,
      this.title,
      this.score,
      this.source,
      this.impressions,
      this.pinned,
      this.updatedAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a tiered suppression allocation in status planned. */
export function newTieredSuppressionAllocation(code: string, title: string): TieredSuppressionAllocation {
  return new TieredSuppressionAllocation(code, title, 0, "", 0, false, 0, "planned");
}
