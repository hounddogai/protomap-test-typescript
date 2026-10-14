import * as text from "../../../../kit/text.js";

/** Where a regional sender bundle is in its life cycle. */
export type RegionalSenderBundleStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A regional sender bundle. Its code is unique within a tenant. */
export class RegionalSenderBundle {
  code: string;
  label: string;
  conversionRate: number;
  clicks: number;
  source: string;
  ownerId: string;
  locale: string;
  expiresAt: number;
  variant: string;
  status: RegionalSenderBundleStatus;

  constructor(
    code: string,
    label: string,
    conversionRate: number,
    clicks: number,
    source: string,
    ownerId: string,
    locale: string,
    expiresAt: number,
    variant: string,
    status: RegionalSenderBundleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.conversionRate = conversionRate;
    this.clicks = clicks;
    this.source = source;
    this.ownerId = ownerId;
    this.locale = locale;
    this.expiresAt = expiresAt;
    this.variant = variant;
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

  canMoveTo(next: RegionalSenderBundleStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved";
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

  moveTo(next: RegionalSenderBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional sender bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"regional sender bundle"} ${this.code}`;
  }

  effectiveExposure(): number {
    return Math.round((this.clicks + this.expiresAt) * 100) / 100;
  }

  copy(): RegionalSenderBundle {
    return new RegionalSenderBundle(
      this.code,
      this.label,
      this.conversionRate,
      this.clicks,
      this.source,
      this.ownerId,
      this.locale,
      this.expiresAt,
      this.variant,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a regional sender bundle in status proposed. */
export function newRegionalSenderBundle(code: string, label: string): RegionalSenderBundle {
  return new RegionalSenderBundle(code, label, 0, 0, "", "", "", 0, "", "proposed");
}
