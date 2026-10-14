import * as text from "../../../../kit/text.js";

/** Where a global badge baseline is in its life cycle. */
export type GlobalBadgeBaselineStatus = "requested" | "granted" | "revoked" | "expired";

/** A global badge baseline. Its code is unique within a tenant. */
export class GlobalBadgeBaseline {
  code: string;
  label: string;
  impressions: number;
  currency: string;
  externalRef: string;
  quantity: number;
  timezone: string;
  summary: string;
  segment: string;
  graceDays: number;
  rate: number;
  status: GlobalBadgeBaselineStatus;

  constructor(
    code: string,
    label: string,
    impressions: number,
    currency: string,
    externalRef: string,
    quantity: number,
    timezone: string,
    summary: string,
    segment: string,
    graceDays: number,
    rate: number,
    status: GlobalBadgeBaselineStatus,
  ) {
    this.code = code;
    this.label = label;
    this.impressions = impressions;
    this.currency = currency;
    this.externalRef = externalRef;
    this.quantity = quantity;
    this.timezone = timezone;
    this.summary = summary;
    this.segment = segment;
    this.graceDays = graceDays;
    this.rate = rate;
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

  canMoveTo(next: GlobalBadgeBaselineStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: GlobalBadgeBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global badge baseline ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"global badge baseline"} ${this.code}`;
  }

  netLoad(): number {
    return Math.round((this.impressions - this.quantity) * 100) / 100;
  }

  copy(): GlobalBadgeBaseline {
    return new GlobalBadgeBaseline(
      this.code,
      this.label,
      this.impressions,
      this.currency,
      this.externalRef,
      this.quantity,
      this.timezone,
      this.summary,
      this.segment,
      this.graceDays,
      this.rate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a global badge baseline in status requested. */
export function newGlobalBadgeBaseline(code: string, label: string): GlobalBadgeBaseline {
  return new GlobalBadgeBaseline(code, label, 0, "", "", 0, "", "", "", 0, 0, "requested");
}
