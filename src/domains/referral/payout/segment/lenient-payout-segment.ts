import * as text from "../../../../kit/text.js";

/** Where a lenient payout segment is in its life cycle. */
export type LenientPayoutSegmentStatus = "requested" | "granted" | "revoked" | "expired";

/** A lenient payout segment as the payout team keeps it. */
export class LenientPayoutSegment {
  code: string;
  name: string;
  variant: string;
  impressions: number;
  retries: number;
  expiresAt: number;
  weight: number;
  revision: number;
  unit: string;
  title: string;
  cost: number;
  status: LenientPayoutSegmentStatus;

  constructor(
    code: string,
    name: string,
    variant: string,
    impressions: number,
    retries: number,
    expiresAt: number,
    weight: number,
    revision: number,
    unit: string,
    title: string,
    cost: number,
    status: LenientPayoutSegmentStatus,
  ) {
    this.code = code;
    this.name = name;
    this.variant = variant;
    this.impressions = impressions;
    this.retries = retries;
    this.expiresAt = expiresAt;
    this.weight = weight;
    this.revision = revision;
    this.unit = unit;
    this.title = title;
    this.cost = cost;
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

  canMoveTo(next: LenientPayoutSegmentStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "expired":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LenientPayoutSegmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient payout segment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  adjustedVolume(): number {
    return Math.round((this.expiresAt - this.weight) * 100) / 100;
  }

  copy(): LenientPayoutSegment {
    return new LenientPayoutSegment(
      this.code,
      this.name,
      this.variant,
      this.impressions,
      this.retries,
      this.expiresAt,
      this.weight,
      this.revision,
      this.unit,
      this.title,
      this.cost,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a lenient payout segment in status requested. */
export function newLenientPayoutSegment(code: string, name: string): LenientPayoutSegment {
  return new LenientPayoutSegment(code, name, "", 0, 0, 0, 0, 0, "", "", 0, "requested");
}
