import * as text from "../../../../kit/text.js";

/** Where a creative review is in its life cycle. */
export type CreativeReviewStatus = "requested" | "granted" | "revoked" | "expired";

/** A creative review as the creative team keeps it. */
export class CreativeReview {
  code: string;
  label: string;
  notes: string;
  batchSize: number;
  updatedAt: number;
  ownerId: string;
  campaignRef: string;
  variant: string;
  quantity: number;
  version: number;
  retries: number;
  status: CreativeReviewStatus;

  constructor(
    code: string,
    label: string,
    notes: string,
    batchSize: number,
    updatedAt: number,
    ownerId: string,
    campaignRef: string,
    variant: string,
    quantity: number,
    version: number,
    retries: number,
    status: CreativeReviewStatus,
  ) {
    this.code = code;
    this.label = label;
    this.notes = notes;
    this.batchSize = batchSize;
    this.updatedAt = updatedAt;
    this.ownerId = ownerId;
    this.campaignRef = campaignRef;
    this.variant = variant;
    this.quantity = quantity;
    this.version = version;
    this.retries = retries;
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

  canMoveTo(next: CreativeReviewStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted";
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: CreativeReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`creative review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  displayLabel(): string {
    return `${"creative review"} ${this.code}`;
  }

  projectedLoad(): number {
    return Math.round((this.batchSize + this.retries) * 100) / 100;
  }

  copy(): CreativeReview {
    return new CreativeReview(
      this.code,
      this.label,
      this.notes,
      this.batchSize,
      this.updatedAt,
      this.ownerId,
      this.campaignRef,
      this.variant,
      this.quantity,
      this.version,
      this.retries,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a creative review in status requested. */
export function newCreativeReview(code: string, label: string): CreativeReview {
  return new CreativeReview(code, label, "", 0, 0, "", "", "", 0, 0, 0, "requested");
}
