import * as text from "../../../../kit/text.js";

/** Where a strict funnel review is in its life cycle. */
export type StrictFunnelReviewStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A strict funnel review. Its code is unique within a tenant. */
export class StrictFunnelReview {
  code: string;
  title: string;
  cohort: string;
  floorValue: number;
  cost: number;
  minimum: number;
  channel: string;
  maximum: number;
  budget: number;
  status: StrictFunnelReviewStatus;

  constructor(
    code: string,
    title: string,
    cohort: string,
    floorValue: number,
    cost: number,
    minimum: number,
    channel: string,
    maximum: number,
    budget: number,
    status: StrictFunnelReviewStatus,
  ) {
    this.code = code;
    this.title = title;
    this.cohort = cohort;
    this.floorValue = floorValue;
    this.cost = cost;
    this.minimum = minimum;
    this.channel = channel;
    this.maximum = maximum;
    this.budget = budget;
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

  canMoveTo(next: StrictFunnelReviewStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "active":
          case "suspended":
            return true;
        }
        return false;
      case "pending":
        return next === "suspended";
      case "active":
        switch (next) {
          case "suspended":
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

  moveTo(next: StrictFunnelReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict funnel review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  weightedExposure(): number {
    return Math.round((this.maximum - this.floorValue) * 100) / 100;
  }

  copy(): StrictFunnelReview {
    return new StrictFunnelReview(
      this.code,
      this.title,
      this.cohort,
      this.floorValue,
      this.cost,
      this.minimum,
      this.channel,
      this.maximum,
      this.budget,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a strict funnel review in status draft. */
export function newStrictFunnelReview(code: string, title: string): StrictFunnelReview {
  return new StrictFunnelReview(code, title, "", 0, 0, 0, "", 0, 0, "draft");
}
