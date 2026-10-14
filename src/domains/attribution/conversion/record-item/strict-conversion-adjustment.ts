import * as text from "../../../../kit/text.js";

/** Where a strict conversion adjustment is in its life cycle. */
export type StrictConversionAdjustmentStatus = "requested" | "granted" | "revoked" | "expired";

/** A strict conversion adjustment as the conversion team keeps it. */
export class StrictConversionAdjustment {
  code: string;
  label: string;
  contactEmail: string;
  updatedAt: number;
  utmSource: string;
  threshold: number;
  openRate: number;
  retries: number;
  expiresAt: number;
  status: StrictConversionAdjustmentStatus;

  constructor(
    code: string,
    label: string,
    contactEmail: string,
    updatedAt: number,
    utmSource: string,
    threshold: number,
    openRate: number,
    retries: number,
    expiresAt: number,
    status: StrictConversionAdjustmentStatus,
  ) {
    this.code = code;
    this.label = label;
    this.contactEmail = contactEmail;
    this.updatedAt = updatedAt;
    this.utmSource = utmSource;
    this.threshold = threshold;
    this.openRate = openRate;
    this.retries = retries;
    this.expiresAt = expiresAt;
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

  canMoveTo(next: StrictConversionAdjustmentStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "granted":
        return next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: StrictConversionAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict conversion adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  adjustedValue(): number {
    return Math.round((this.threshold + this.openRate) * 100) / 100;
  }

  copy(): StrictConversionAdjustment {
    return new StrictConversionAdjustment(
      this.code,
      this.label,
      this.contactEmail,
      this.updatedAt,
      this.utmSource,
      this.threshold,
      this.openRate,
      this.retries,
      this.expiresAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a strict conversion adjustment in status requested. */
export function newStrictConversionAdjustment(code: string, label: string): StrictConversionAdjustment {
  return new StrictConversionAdjustment(code, label, "", 0, "", 0, 0, 0, 0, "requested");
}
