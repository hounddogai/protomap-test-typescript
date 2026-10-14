import * as text from "../../../../kit/text.js";

/** Where a touchpoint claim is in its life cycle. */
export type TouchpointClaimStatus = "requested" | "granted" | "revoked" | "expired";

/** One touchpoint claim, with what the planners need to act on it. */
export class TouchpointClaim {
  code: string;
  label: string;
  region: string;
  currency: string;
  unit: string;
  threshold: number;
  quantity: number;
  channel: string;
  utmSource: string;
  checksum: string;
  ceiling: number;
  status: TouchpointClaimStatus;

  constructor(
    code: string,
    label: string,
    region: string,
    currency: string,
    unit: string,
    threshold: number,
    quantity: number,
    channel: string,
    utmSource: string,
    checksum: string,
    ceiling: number,
    status: TouchpointClaimStatus,
  ) {
    this.code = code;
    this.label = label;
    this.region = region;
    this.currency = currency;
    this.unit = unit;
    this.threshold = threshold;
    this.quantity = quantity;
    this.channel = channel;
    this.utmSource = utmSource;
    this.checksum = checksum;
    this.ceiling = ceiling;
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

  canMoveTo(next: TouchpointClaimStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "expired";
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: TouchpointClaimStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`touchpoint claim ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"touchpoint claim"} ${this.code}`;
  }

  adjustedVolume(): number {
    return Math.round((this.quantity - this.threshold) * 100) / 100;
  }

  copy(): TouchpointClaim {
    return new TouchpointClaim(
      this.code,
      this.label,
      this.region,
      this.currency,
      this.unit,
      this.threshold,
      this.quantity,
      this.channel,
      this.utmSource,
      this.checksum,
      this.ceiling,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a touchpoint claim in status requested. */
export function newTouchpointClaim(code: string, label: string): TouchpointClaim {
  return new TouchpointClaim(code, label, "", "", "", 0, 0, "", "", "", 0, "requested");
}
