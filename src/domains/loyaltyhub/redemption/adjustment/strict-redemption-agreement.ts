import * as text from "../../../../kit/text.js";

/** Where a strict redemption agreement is in its life cycle. */
export type StrictRedemptionAgreementStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a strict redemption agreement and its current status. */
export class StrictRedemptionAgreement {
  code: string;
  label: string;
  sequence: number;
  utmSource: string;
  capacity: number;
  clicks: number;
  updatedAt: number;
  timezone: string;
  attempts: number;
  expiresAt: number;
  locale: string;
  status: StrictRedemptionAgreementStatus;

  constructor(
    code: string,
    label: string,
    sequence: number,
    utmSource: string,
    capacity: number,
    clicks: number,
    updatedAt: number,
    timezone: string,
    attempts: number,
    expiresAt: number,
    locale: string,
    status: StrictRedemptionAgreementStatus,
  ) {
    this.code = code;
    this.label = label;
    this.sequence = sequence;
    this.utmSource = utmSource;
    this.capacity = capacity;
    this.clicks = clicks;
    this.updatedAt = updatedAt;
    this.timezone = timezone;
    this.attempts = attempts;
    this.expiresAt = expiresAt;
    this.locale = locale;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: StrictRedemptionAgreementStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
          case "running":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: StrictRedemptionAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict redemption agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  netValue(): number {
    return Math.round(this.updatedAt * this.capacity * 100) / 100;
  }

  copy(): StrictRedemptionAgreement {
    return new StrictRedemptionAgreement(
      this.code,
      this.label,
      this.sequence,
      this.utmSource,
      this.capacity,
      this.clicks,
      this.updatedAt,
      this.timezone,
      this.attempts,
      this.expiresAt,
      this.locale,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a strict redemption agreement in status new. */
export function newStrictRedemptionAgreement(code: string, label: string): StrictRedemptionAgreement {
  return new StrictRedemptionAgreement(code, label, 0, "", 0, 0, 0, "", 0, 0, "", "new");
}
