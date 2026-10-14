import * as text from "../../../../kit/text.js";

/** Where a paywall slot is in its life cycle. */
export type PaywallSlotStatus = "requested" | "granted" | "revoked" | "expired";

/** A paywall slot. Its code is unique within a tenant. */
export class PaywallSlot {
  code: string;
  title: string;
  channel: string;
  expiresAt: number;
  revision: number;
  unit: string;
  status: PaywallSlotStatus;

  constructor(
    code: string,
    title: string,
    channel: string,
    expiresAt: number,
    revision: number,
    unit: string,
    status: PaywallSlotStatus,
  ) {
    this.code = code;
    this.title = title;
    this.channel = channel;
    this.expiresAt = expiresAt;
    this.revision = revision;
    this.unit = unit;
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

  canMoveTo(next: PaywallSlotStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "revoked";
      case "granted":
        return next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: PaywallSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`paywall slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  effectiveExposure(): number {
    return Math.round((this.expiresAt - this.revision) * 100) / 100;
  }

  copy(): PaywallSlot {
    return new PaywallSlot(this.code, this.title, this.channel, this.expiresAt, this.revision, this.unit, this.status);
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a paywall slot in status requested. */
export function newPaywallSlot(code: string, title: string): PaywallSlot {
  return new PaywallSlot(code, title, "", 0, 0, "", "requested");
}
