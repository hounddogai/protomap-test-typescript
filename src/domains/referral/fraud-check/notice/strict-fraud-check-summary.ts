import * as text from "../../../../kit/text.js";

/** Where a strict fraud check summary is in its life cycle. */
export type StrictFraudCheckSummaryStatus = "requested" | "granted" | "revoked" | "expired";

/** A strict fraud check summary. Its code is unique within a tenant. */
export class StrictFraudCheckSummary {
  code: string;
  label: string;
  version: number;
  threshold: number;
  conversionRate: number;
  contactEmail: string;
  revision: number;
  clicks: number;
  pinned: boolean;
  ratio: number;
  status: StrictFraudCheckSummaryStatus;

  constructor(
    code: string,
    label: string,
    version: number,
    threshold: number,
    conversionRate: number,
    contactEmail: string,
    revision: number,
    clicks: number,
    pinned: boolean,
    ratio: number,
    status: StrictFraudCheckSummaryStatus,
  ) {
    this.code = code;
    this.label = label;
    this.version = version;
    this.threshold = threshold;
    this.conversionRate = conversionRate;
    this.contactEmail = contactEmail;
    this.revision = revision;
    this.clicks = clicks;
    this.pinned = pinned;
    this.ratio = ratio;
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

  canMoveTo(next: StrictFraudCheckSummaryStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted";
      case "granted":
        return next === "revoked";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: StrictFraudCheckSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict fraud check summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  netTotal(): number {
    return Math.round((this.ratio + this.revision) * 100) / 100;
  }

  copy(): StrictFraudCheckSummary {
    return new StrictFraudCheckSummary(
      this.code,
      this.label,
      this.version,
      this.threshold,
      this.conversionRate,
      this.contactEmail,
      this.revision,
      this.clicks,
      this.pinned,
      this.ratio,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a strict fraud check summary in status requested. */
export function newStrictFraudCheckSummary(code: string, label: string): StrictFraudCheckSummary {
  return new StrictFraudCheckSummary(code, label, 0, 0, 0, "", 0, 0, false, 0, "requested");
}
