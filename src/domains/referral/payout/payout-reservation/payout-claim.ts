import * as text from "../../../../kit/text.js";

/** Where a payout claim is in its life cycle. */
export type PayoutClaimStatus = "created" | "validated" | "published" | "retired";

/** A payout claim. Its code is unique within a tenant. */
export class PayoutClaim {
  code: string;
  label: string;
  priority: number;
  ownerId: string;
  unit: string;
  pinned: boolean;
  attributes: Map<string, string>;
  bid: number;
  status: PayoutClaimStatus;

  constructor(
    code: string,
    label: string,
    priority: number,
    ownerId: string,
    unit: string,
    pinned: boolean,
    attributes: Map<string, string>,
    bid: number,
    status: PayoutClaimStatus,
  ) {
    this.code = code;
    this.label = label;
    this.priority = priority;
    this.ownerId = ownerId;
    this.unit = unit;
    this.pinned = pinned;
    this.attributes = attributes;
    this.bid = bid;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: PayoutClaimStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated" || next === "published";
      case "validated":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: PayoutClaimStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`payout claim ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  projectedValue(): number {
    return Math.round(this.bid * this.priority * 100) / 100;
  }

  copy(): PayoutClaim {
    return new PayoutClaim(
      this.code,
      this.label,
      this.priority,
      this.ownerId,
      this.unit,
      this.pinned,
      this.attributes,
      this.bid,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a payout claim in status created. */
export function newPayoutClaim(code: string, label: string): PayoutClaim {
  return new PayoutClaim(code, label, 0, "", "", false, new Map<string, string>(), 0, "created");
}
