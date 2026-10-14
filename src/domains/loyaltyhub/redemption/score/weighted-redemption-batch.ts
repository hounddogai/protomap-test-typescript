import * as text from "../../../../kit/text.js";

/** Where a weighted redemption batch is in its life cycle. */
export type WeightedRedemptionBatchStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A weighted redemption batch. Its code is unique within a tenant. */
export class WeightedRedemptionBatch {
  code: string;
  label: string;
  createdAt: number;
  maximum: number;
  attributes: Map<string, string>;
  discount: number;
  tags: string[];
  notes: string;
  status: WeightedRedemptionBatchStatus;

  constructor(
    code: string,
    label: string,
    createdAt: number,
    maximum: number,
    attributes: Map<string, string>,
    discount: number,
    tags: string[],
    notes: string,
    status: WeightedRedemptionBatchStatus,
  ) {
    this.code = code;
    this.label = label;
    this.createdAt = createdAt;
    this.maximum = maximum;
    this.attributes = attributes;
    this.discount = discount;
    this.tags = tags;
    this.notes = notes;
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

  canMoveTo(next: WeightedRedemptionBatchStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "scheduled":
        return next === "cancelled";
      case "in_progress":
        return next === "completed";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: WeightedRedemptionBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted redemption batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  adjustedExposure(): number {
    return Math.round(this.discount * this.maximum * 100) / 100;
  }

  copy(): WeightedRedemptionBatch {
    return new WeightedRedemptionBatch(
      this.code,
      this.label,
      this.createdAt,
      this.maximum,
      this.attributes,
      this.discount,
      this.tags,
      this.notes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a weighted redemption batch in status planned. */
export function newWeightedRedemptionBatch(code: string, label: string): WeightedRedemptionBatch {
  return new WeightedRedemptionBatch(code, label, 0, 0, new Map<string, string>(), 0, [], "", "planned");
}
