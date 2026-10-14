import * as text from "../../../../kit/text.js";

/** Where a placement batch is in its life cycle. */
export type PlacementBatchStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A placement batch. Its code is unique within a tenant. */
export class PlacementBatch {
  code: string;
  label: string;
  budget: number;
  impressions: number;
  maximum: number;
  quantity: number;
  ownerId: string;
  score: number;
  amount: number;
  tags: string[];
  locale: string;
  status: PlacementBatchStatus;

  constructor(
    code: string,
    label: string,
    budget: number,
    impressions: number,
    maximum: number,
    quantity: number,
    ownerId: string,
    score: number,
    amount: number,
    tags: string[],
    locale: string,
    status: PlacementBatchStatus,
  ) {
    this.code = code;
    this.label = label;
    this.budget = budget;
    this.impressions = impressions;
    this.maximum = maximum;
    this.quantity = quantity;
    this.ownerId = ownerId;
    this.score = score;
    this.amount = amount;
    this.tags = tags;
    this.locale = locale;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: PlacementBatchStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved";
      case "approved":
        return next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: PlacementBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`placement batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  weightedTotal(): number {
    return Math.round((this.impressions + this.budget) * 100) / 100;
  }

  copy(): PlacementBatch {
    return new PlacementBatch(
      this.code,
      this.label,
      this.budget,
      this.impressions,
      this.maximum,
      this.quantity,
      this.ownerId,
      this.score,
      this.amount,
      this.tags,
      this.locale,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a placement batch in status proposed. */
export function newPlacementBatch(code: string, label: string): PlacementBatch {
  return new PlacementBatch(code, label, 0, 0, 0, 0, "", 0, 0, [], "", "proposed");
}
