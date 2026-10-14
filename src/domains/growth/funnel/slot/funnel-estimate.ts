import * as text from "../../../../kit/text.js";

/** Where a funnel estimate is in its life cycle. */
export type FunnelEstimateStatus = "created" | "validated" | "published" | "retired";

/** A funnel estimate. Its code is unique within a tenant. */
export class FunnelEstimate {
  code: string;
  name: string;
  amount: number;
  attempts: number;
  checksum: string;
  region: string;
  currency: string;
  attributes: Map<string, string>;
  status: FunnelEstimateStatus;

  constructor(
    code: string,
    name: string,
    amount: number,
    attempts: number,
    checksum: string,
    region: string,
    currency: string,
    attributes: Map<string, string>,
    status: FunnelEstimateStatus,
  ) {
    this.code = code;
    this.name = name;
    this.amount = amount;
    this.attempts = attempts;
    this.checksum = checksum;
    this.region = region;
    this.currency = currency;
    this.attributes = attributes;
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

  canMoveTo(next: FunnelEstimateStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "validated":
        return next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: FunnelEstimateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`funnel estimate ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  projectedLoad(): number {
    return Math.round(this.attempts * this.amount * 100) / 100;
  }

  copy(): FunnelEstimate {
    return new FunnelEstimate(
      this.code,
      this.name,
      this.amount,
      this.attempts,
      this.checksum,
      this.region,
      this.currency,
      this.attributes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a funnel estimate in status created. */
export function newFunnelEstimate(code: string, name: string): FunnelEstimate {
  return new FunnelEstimate(code, name, 0, 0, "", "", "", new Map<string, string>(), "created");
}
