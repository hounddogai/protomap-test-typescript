import * as text from "../../../../kit/text.js";

/** Where a weighted window review is in its life cycle. */
export type WeightedWindowReviewStatus = "requested" | "granted" | "revoked" | "expired";

/** One weighted window review, with what the planners need to act on it. */
export class WeightedWindowReview {
  code: string;
  name: string;
  checksum: string;
  campaignRef: string;
  createdAt: number;
  batchSize: number;
  revision: number;
  channel: string;
  sendAt: number;
  ceiling: number;
  status: WeightedWindowReviewStatus;

  constructor(
    code: string,
    name: string,
    checksum: string,
    campaignRef: string,
    createdAt: number,
    batchSize: number,
    revision: number,
    channel: string,
    sendAt: number,
    ceiling: number,
    status: WeightedWindowReviewStatus,
  ) {
    this.code = code;
    this.name = name;
    this.checksum = checksum;
    this.campaignRef = campaignRef;
    this.createdAt = createdAt;
    this.batchSize = batchSize;
    this.revision = revision;
    this.channel = channel;
    this.sendAt = sendAt;
    this.ceiling = ceiling;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: WeightedWindowReviewStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "expired";
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: WeightedWindowReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted window review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${"weighted window review"} ${this.code}`;
  }

  projectedTotal(): number {
    return Math.round(this.ceiling * this.createdAt * 100) / 100;
  }

  copy(): WeightedWindowReview {
    return new WeightedWindowReview(
      this.code,
      this.name,
      this.checksum,
      this.campaignRef,
      this.createdAt,
      this.batchSize,
      this.revision,
      this.channel,
      this.sendAt,
      this.ceiling,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a weighted window review in status requested. */
export function newWeightedWindowReview(code: string, name: string): WeightedWindowReview {
  return new WeightedWindowReview(code, name, "", "", 0, 0, 0, "", 0, 0, "requested");
}
