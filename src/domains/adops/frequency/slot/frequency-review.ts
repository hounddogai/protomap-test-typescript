import * as text from "../../../../kit/text.js";

/** Where a frequency review is in its life cycle. */
export type FrequencyReviewStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A frequency review as the frequency team keeps it. */
export class FrequencyReview {
  code: string;
  name: string;
  region: string;
  cost: number;
  floorValue: number;
  checksum: string;
  status: FrequencyReviewStatus;

  constructor(
    code: string,
    name: string,
    region: string,
    cost: number,
    floorValue: number,
    checksum: string,
    status: FrequencyReviewStatus,
  ) {
    this.code = code;
    this.name = name;
    this.region = region;
    this.cost = cost;
    this.floorValue = floorValue;
    this.checksum = checksum;
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

  canMoveTo(next: FrequencyReviewStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "in_review":
        return next === "reopened";
      case "resolved":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: FrequencyReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`frequency review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  effectiveVolume(): number {
    return Math.round((this.cost + this.floorValue) * 100) / 100;
  }

  copy(): FrequencyReview {
    return new FrequencyReview(
      this.code,
      this.name,
      this.region,
      this.cost,
      this.floorValue,
      this.checksum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a frequency review in status open. */
export function newFrequencyReview(code: string, name: string): FrequencyReview {
  return new FrequencyReview(code, name, "", 0, 0, "", "open");
}
