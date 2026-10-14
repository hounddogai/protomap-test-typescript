import * as text from "../../../../kit/text.js";

/** Where a manual paywall variance is in its life cycle. */
export type ManualPaywallVarianceStatus = "new" | "queued" | "running" | "done" | "failed";

/** A manual paywall variance as the paywall team keeps it. */
export class ManualPaywallVariance {
  code: string;
  label: string;
  endsAt: number;
  ratio: number;
  utmSource: string;
  currency: string;
  source: string;
  variant: string;
  status: ManualPaywallVarianceStatus;

  constructor(
    code: string,
    label: string,
    endsAt: number,
    ratio: number,
    utmSource: string,
    currency: string,
    source: string,
    variant: string,
    status: ManualPaywallVarianceStatus,
  ) {
    this.code = code;
    this.label = label;
    this.endsAt = endsAt;
    this.ratio = ratio;
    this.utmSource = utmSource;
    this.currency = currency;
    this.source = source;
    this.variant = variant;
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

  canMoveTo(next: ManualPaywallVarianceStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "done";
      case "queued":
        return next === "running" || next === "failed";
      case "running":
        return next === "done" || next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ManualPaywallVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual paywall variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  effectiveTotal(): number {
    return Math.round(this.endsAt * this.ratio * 100) / 100;
  }

  copy(): ManualPaywallVariance {
    return new ManualPaywallVariance(
      this.code,
      this.label,
      this.endsAt,
      this.ratio,
      this.utmSource,
      this.currency,
      this.source,
      this.variant,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a manual paywall variance in status new. */
export function newManualPaywallVariance(code: string, label: string): ManualPaywallVariance {
  return new ManualPaywallVariance(code, label, 0, 0, "", "", "", "", "new");
}
