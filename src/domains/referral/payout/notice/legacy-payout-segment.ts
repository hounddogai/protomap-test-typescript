import * as text from "../../../../kit/text.js";

/** Where a legacy payout segment is in its life cycle. */
export type LegacyPayoutSegmentStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A legacy payout segment. Its code is unique within a tenant. */
export class LegacyPayoutSegment {
  code: string;
  name: string;
  revision: number;
  currency: string;
  quantity: number;
  limit: number;
  unit: string;
  retries: number;
  batchSize: number;
  category: string;
  utmSource: string;
  status: LegacyPayoutSegmentStatus;

  constructor(
    code: string,
    name: string,
    revision: number,
    currency: string,
    quantity: number,
    limit: number,
    unit: string,
    retries: number,
    batchSize: number,
    category: string,
    utmSource: string,
    status: LegacyPayoutSegmentStatus,
  ) {
    this.code = code;
    this.name = name;
    this.revision = revision;
    this.currency = currency;
    this.quantity = quantity;
    this.limit = limit;
    this.unit = unit;
    this.retries = retries;
    this.batchSize = batchSize;
    this.category = category;
    this.utmSource = utmSource;
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

  canMoveTo(next: LegacyPayoutSegmentStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
          case "rejected":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LegacyPayoutSegmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy payout segment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${"legacy payout segment"} ${this.code}`;
  }

  adjustedExposure(): number {
    return Math.round((this.quantity + this.limit) * 100) / 100;
  }

  copy(): LegacyPayoutSegment {
    return new LegacyPayoutSegment(
      this.code,
      this.name,
      this.revision,
      this.currency,
      this.quantity,
      this.limit,
      this.unit,
      this.retries,
      this.batchSize,
      this.category,
      this.utmSource,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a legacy payout segment in status proposed. */
export function newLegacyPayoutSegment(code: string, name: string): LegacyPayoutSegment {
  return new LegacyPayoutSegment(code, name, 0, "", 0, 0, "", 0, 0, "", "", "proposed");
}
