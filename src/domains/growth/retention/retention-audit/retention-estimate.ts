import * as text from "../../../../kit/text.js";

/** Where a retention estimate is in its life cycle. */
export type RetentionEstimateStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One retention estimate, with what the planners need to act on it. */
export class RetentionEstimate {
  code: string;
  label: string;
  ownerId: string;
  limit: number;
  audienceId: string;
  currency: string;
  region: string;
  rate: number;
  bid: number;
  status: RetentionEstimateStatus;

  constructor(
    code: string,
    label: string,
    ownerId: string,
    limit: number,
    audienceId: string,
    currency: string,
    region: string,
    rate: number,
    bid: number,
    status: RetentionEstimateStatus,
  ) {
    this.code = code;
    this.label = label;
    this.ownerId = ownerId;
    this.limit = limit;
    this.audienceId = audienceId;
    this.currency = currency;
    this.region = region;
    this.rate = rate;
    this.bid = bid;
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

  canMoveTo(next: RetentionEstimateStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
          case "completed":
            return true;
        }
        return false;
      case "scheduled":
        return next === "completed";
      case "in_progress":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RetentionEstimateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`retention estimate ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"retention estimate"} ${this.code}`;
  }

  weightedVolume(): number {
    return Math.round((this.limit + this.rate) * 100) / 100;
  }

  copy(): RetentionEstimate {
    return new RetentionEstimate(
      this.code,
      this.label,
      this.ownerId,
      this.limit,
      this.audienceId,
      this.currency,
      this.region,
      this.rate,
      this.bid,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a retention estimate in status planned. */
export function newRetentionEstimate(code: string, label: string): RetentionEstimate {
  return new RetentionEstimate(code, label, "", 0, "", "", "", 0, 0, "planned");
}
