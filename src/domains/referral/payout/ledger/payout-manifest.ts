import * as text from "../../../../kit/text.js";

/** Where a payout manifest is in its life cycle. */
export type PayoutManifestStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A payout manifest as the payout team keeps it. */
export class PayoutManifest {
  code: string;
  label: string;
  reviewer: string;
  locale: string;
  endsAt: number;
  timezone: string;
  sequence: number;
  floorValue: number;
  variant: string;
  maximum: number;
  status: PayoutManifestStatus;

  constructor(
    code: string,
    label: string,
    reviewer: string,
    locale: string,
    endsAt: number,
    timezone: string,
    sequence: number,
    floorValue: number,
    variant: string,
    maximum: number,
    status: PayoutManifestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.reviewer = reviewer;
    this.locale = locale;
    this.endsAt = endsAt;
    this.timezone = timezone;
    this.sequence = sequence;
    this.floorValue = floorValue;
    this.variant = variant;
    this.maximum = maximum;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: PayoutManifestStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "active" || next === "closed";
      case "pending":
        return next === "closed";
      case "active":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PayoutManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`payout manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"payout manifest"} ${this.code}`;
  }

  weightedLoad(): number {
    return Math.round(this.floorValue * this.endsAt * 100) / 100;
  }

  copy(): PayoutManifest {
    return new PayoutManifest(
      this.code,
      this.label,
      this.reviewer,
      this.locale,
      this.endsAt,
      this.timezone,
      this.sequence,
      this.floorValue,
      this.variant,
      this.maximum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a payout manifest in status draft. */
export function newPayoutManifest(code: string, label: string): PayoutManifest {
  return new PayoutManifest(code, label, "", "", 0, "", 0, 0, "", 0, "draft");
}
