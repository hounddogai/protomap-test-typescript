import * as text from "../../../../kit/text.js";

/** Where a paywall score is in its life cycle. */
export type PaywallScoreStatus = "requested" | "granted" | "revoked" | "expired";

/** A paywall score. Its code is unique within a tenant. */
export class PaywallScore {
  code: string;
  name: string;
  pinned: boolean;
  maximum: number;
  retries: number;
  expiresAt: number;
  ownerId: string;
  channel: string;
  openRate: number;
  status: PaywallScoreStatus;

  constructor(
    code: string,
    name: string,
    pinned: boolean,
    maximum: number,
    retries: number,
    expiresAt: number,
    ownerId: string,
    channel: string,
    openRate: number,
    status: PaywallScoreStatus,
  ) {
    this.code = code;
    this.name = name;
    this.pinned = pinned;
    this.maximum = maximum;
    this.retries = retries;
    this.expiresAt = expiresAt;
    this.ownerId = ownerId;
    this.channel = channel;
    this.openRate = openRate;
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

  canMoveTo(next: PaywallScoreStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "expired";
      case "granted":
        return next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: PaywallScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`paywall score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  adjustedVolume(): number {
    return Math.round(this.expiresAt * this.retries * 100) / 100;
  }

  copy(): PaywallScore {
    return new PaywallScore(
      this.code,
      this.name,
      this.pinned,
      this.maximum,
      this.retries,
      this.expiresAt,
      this.ownerId,
      this.channel,
      this.openRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a paywall score in status requested. */
export function newPaywallScore(code: string, name: string): PaywallScore {
  return new PaywallScore(code, name, false, 0, 0, 0, "", "", 0, "requested");
}
