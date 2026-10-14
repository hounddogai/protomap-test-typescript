import * as text from "../../../../kit/text.js";

/** Where a weighted credit digest is in its life cycle. */
export type WeightedCreditDigestStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A weighted credit digest as the credit team keeps it. */
export class WeightedCreditDigest {
  code: string;
  title: string;
  checksum: string;
  attributes: Map<string, string>;
  currency: string;
  score: number;
  capacity: number;
  impressions: number;
  visible: boolean;
  externalRef: string;
  createdAt: number;
  status: WeightedCreditDigestStatus;

  constructor(
    code: string,
    title: string,
    checksum: string,
    attributes: Map<string, string>,
    currency: string,
    score: number,
    capacity: number,
    impressions: number,
    visible: boolean,
    externalRef: string,
    createdAt: number,
    status: WeightedCreditDigestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.checksum = checksum;
    this.attributes = attributes;
    this.currency = currency;
    this.score = score;
    this.capacity = capacity;
    this.impressions = impressions;
    this.visible = visible;
    this.externalRef = externalRef;
    this.createdAt = createdAt;
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

  canMoveTo(next: WeightedCreditDigestStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
          case "in_progress":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "in_progress":
          case "completed":
            return true;
        }
        return false;
      case "in_progress":
        return next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: WeightedCreditDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted credit digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"weighted credit digest"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  projectedValue(): number {
    return Math.round(this.capacity * this.impressions * 100) / 100;
  }

  copy(): WeightedCreditDigest {
    return new WeightedCreditDigest(
      this.code,
      this.title,
      this.checksum,
      this.attributes,
      this.currency,
      this.score,
      this.capacity,
      this.impressions,
      this.visible,
      this.externalRef,
      this.createdAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a weighted credit digest in status planned. */
export function newWeightedCreditDigest(code: string, title: string): WeightedCreditDigest {
  return new WeightedCreditDigest(code, title, "", new Map<string, string>(), "", 0, 0, 0, false, "", 0, "planned");
}
