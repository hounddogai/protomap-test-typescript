import * as text from "../../../../kit/text.js";

/** Where a default credit digest is in its life cycle. */
export type DefaultCreditDigestStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A default credit digest as the credit team keeps it. */
export class DefaultCreditDigest {
  code: string;
  label: string;
  ceiling: number;
  durationMinutes: number;
  conversionRate: number;
  startsAt: number;
  active: boolean;
  batchSize: number;
  contactEmail: string;
  impressions: number;
  frequencyCap: number;
  status: DefaultCreditDigestStatus;

  constructor(
    code: string,
    label: string,
    ceiling: number,
    durationMinutes: number,
    conversionRate: number,
    startsAt: number,
    active: boolean,
    batchSize: number,
    contactEmail: string,
    impressions: number,
    frequencyCap: number,
    status: DefaultCreditDigestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.ceiling = ceiling;
    this.durationMinutes = durationMinutes;
    this.conversionRate = conversionRate;
    this.startsAt = startsAt;
    this.active = active;
    this.batchSize = batchSize;
    this.contactEmail = contactEmail;
    this.impressions = impressions;
    this.frequencyCap = frequencyCap;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: DefaultCreditDigestStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        return next === "archived";
      case "resolved":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: DefaultCreditDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default credit digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  projectedExposure(): number {
    return Math.round(this.frequencyCap * this.startsAt * 100) / 100;
  }

  copy(): DefaultCreditDigest {
    return new DefaultCreditDigest(
      this.code,
      this.label,
      this.ceiling,
      this.durationMinutes,
      this.conversionRate,
      this.startsAt,
      this.active,
      this.batchSize,
      this.contactEmail,
      this.impressions,
      this.frequencyCap,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a default credit digest in status open. */
export function newDefaultCreditDigest(code: string, label: string): DefaultCreditDigest {
  return new DefaultCreditDigest(code, label, 0, 0, 0, 0, false, 0, "", 0, 0, "open");
}
