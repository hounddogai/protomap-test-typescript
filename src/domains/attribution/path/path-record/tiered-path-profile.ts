import * as text from "../../../../kit/text.js";

/** Where a tiered path profile is in its life cycle. */
export type TieredPathProfileStatus = "requested" | "granted" | "revoked" | "expired";

/** A tiered path profile as the path team keeps it. */
export class TieredPathProfile {
  code: string;
  label: string;
  conversionRate: number;
  weight: number;
  checksum: string;
  timezone: string;
  clicks: number;
  unit: string;
  status: TieredPathProfileStatus;

  constructor(
    code: string,
    label: string,
    conversionRate: number,
    weight: number,
    checksum: string,
    timezone: string,
    clicks: number,
    unit: string,
    status: TieredPathProfileStatus,
  ) {
    this.code = code;
    this.label = label;
    this.conversionRate = conversionRate;
    this.weight = weight;
    this.checksum = checksum;
    this.timezone = timezone;
    this.clicks = clicks;
    this.unit = unit;
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

  canMoveTo(next: TieredPathProfileStatus): boolean {
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
          case "revoked":
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

  moveTo(next: TieredPathProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered path profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  projectedValue(): number {
    return Math.round((this.clicks - this.conversionRate) * 100) / 100;
  }

  copy(): TieredPathProfile {
    return new TieredPathProfile(
      this.code,
      this.label,
      this.conversionRate,
      this.weight,
      this.checksum,
      this.timezone,
      this.clicks,
      this.unit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a tiered path profile in status requested. */
export function newTieredPathProfile(code: string, label: string): TieredPathProfile {
  return new TieredPathProfile(code, label, 0, 0, "", "", 0, "", "requested");
}
