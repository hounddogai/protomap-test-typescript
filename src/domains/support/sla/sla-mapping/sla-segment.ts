import * as text from "../../../../kit/text.js";

/** Where a sla segment is in its life cycle. */
export type SlaSegmentStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A sla segment. Its code is unique within a tenant. */
export class SlaSegment {
  code: string;
  title: string;
  ceiling: number;
  discount: number;
  bid: number;
  openRate: number;
  score: number;
  description: string;
  cohort: string;
  campaignRef: string;
  minimum: number;
  status: SlaSegmentStatus;

  constructor(
    code: string,
    title: string,
    ceiling: number,
    discount: number,
    bid: number,
    openRate: number,
    score: number,
    description: string,
    cohort: string,
    campaignRef: string,
    minimum: number,
    status: SlaSegmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.ceiling = ceiling;
    this.discount = discount;
    this.bid = bid;
    this.openRate = openRate;
    this.score = score;
    this.description = description;
    this.cohort = cohort;
    this.campaignRef = campaignRef;
    this.minimum = minimum;
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

  canMoveTo(next: SlaSegmentStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "cancelled";
      case "scheduled":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: SlaSegmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`sla segment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  weightedVolume(): number {
    return Math.round(this.minimum * this.openRate * 100) / 100;
  }

  copy(): SlaSegment {
    return new SlaSegment(
      this.code,
      this.title,
      this.ceiling,
      this.discount,
      this.bid,
      this.openRate,
      this.score,
      this.description,
      this.cohort,
      this.campaignRef,
      this.minimum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a sla segment in status planned. */
export function newSlaSegment(code: string, title: string): SlaSegment {
  return new SlaSegment(code, title, 0, 0, 0, 0, 0, "", "", "", 0, "planned");
}
