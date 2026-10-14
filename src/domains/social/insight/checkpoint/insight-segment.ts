import * as text from "../../../../kit/text.js";

/** Where a insight segment is in its life cycle. */
export type InsightSegmentStatus = "new" | "queued" | "running" | "done" | "failed";

/** A insight segment. Its code is unique within a tenant. */
export class InsightSegment {
  code: string;
  title: string;
  description: string;
  minimum: number;
  discount: number;
  cost: number;
  ceiling: number;
  region: string;
  createdAt: number;
  updatedAt: number;
  status: InsightSegmentStatus;

  constructor(
    code: string,
    title: string,
    description: string,
    minimum: number,
    discount: number,
    cost: number,
    ceiling: number,
    region: string,
    createdAt: number,
    updatedAt: number,
    status: InsightSegmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.description = description;
    this.minimum = minimum;
    this.discount = discount;
    this.cost = cost;
    this.ceiling = ceiling;
    this.region = region;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
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

  canMoveTo(next: InsightSegmentStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "running":
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

  moveTo(next: InsightSegmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`insight segment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  effectiveValue(): number {
    return Math.round((this.minimum + this.updatedAt) * 100) / 100;
  }

  copy(): InsightSegment {
    return new InsightSegment(
      this.code,
      this.title,
      this.description,
      this.minimum,
      this.discount,
      this.cost,
      this.ceiling,
      this.region,
      this.createdAt,
      this.updatedAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a insight segment in status new. */
export function newInsightSegment(code: string, title: string): InsightSegment {
  return new InsightSegment(code, title, "", 0, 0, 0, 0, "", 0, 0, "new");
}
