import * as text from "../../../../kit/text.js";

/** Where a lenient funnel claim is in its life cycle. */
export type LenientFunnelClaimStatus = "new" | "queued" | "running" | "done" | "failed";

/** A lenient funnel claim. Its code is unique within a tenant. */
export class LenientFunnelClaim {
  code: string;
  label: string;
  checksum: string;
  openRate: number;
  channel: string;
  currency: string;
  campaignRef: string;
  locale: string;
  utmSource: string;
  status: LenientFunnelClaimStatus;

  constructor(
    code: string,
    label: string,
    checksum: string,
    openRate: number,
    channel: string,
    currency: string,
    campaignRef: string,
    locale: string,
    utmSource: string,
    status: LenientFunnelClaimStatus,
  ) {
    this.code = code;
    this.label = label;
    this.checksum = checksum;
    this.openRate = openRate;
    this.channel = channel;
    this.currency = currency;
    this.campaignRef = campaignRef;
    this.locale = locale;
    this.utmSource = utmSource;
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

  canMoveTo(next: LenientFunnelClaimStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running" || next === "failed";
      case "queued":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "running":
        return next === "done" || next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: LenientFunnelClaimStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient funnel claim ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"lenient funnel claim"} ${this.code}`;
  }

  measuredValue(): number {
    return this.openRate;
  }

  copy(): LenientFunnelClaim {
    return new LenientFunnelClaim(
      this.code,
      this.label,
      this.checksum,
      this.openRate,
      this.channel,
      this.currency,
      this.campaignRef,
      this.locale,
      this.utmSource,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a lenient funnel claim in status new. */
export function newLenientFunnelClaim(code: string, label: string): LenientFunnelClaim {
  return new LenientFunnelClaim(code, label, "", 0, "", "", "", "", "", "new");
}
