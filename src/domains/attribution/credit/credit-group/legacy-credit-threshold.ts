import * as text from "../../../../kit/text.js";

/** Where a legacy credit threshold is in its life cycle. */
export type LegacyCreditThresholdStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A legacy credit threshold. Its code is unique within a tenant. */
export class LegacyCreditThreshold {
  code: string;
  title: string;
  endsAt: number;
  sendAt: number;
  conversionRate: number;
  quantity: number;
  checksum: string;
  ownerId: string;
  status: LegacyCreditThresholdStatus;

  constructor(
    code: string,
    title: string,
    endsAt: number,
    sendAt: number,
    conversionRate: number,
    quantity: number,
    checksum: string,
    ownerId: string,
    status: LegacyCreditThresholdStatus,
  ) {
    this.code = code;
    this.title = title;
    this.endsAt = endsAt;
    this.sendAt = sendAt;
    this.conversionRate = conversionRate;
    this.quantity = quantity;
    this.checksum = checksum;
    this.ownerId = ownerId;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: LegacyCreditThresholdStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming";
      case "warming":
        return next === "ready";
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LegacyCreditThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy credit threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  effectiveTotal(): number {
    return Math.round((this.sendAt - this.endsAt) * 100) / 100;
  }

  copy(): LegacyCreditThreshold {
    return new LegacyCreditThreshold(
      this.code,
      this.title,
      this.endsAt,
      this.sendAt,
      this.conversionRate,
      this.quantity,
      this.checksum,
      this.ownerId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a legacy credit threshold in status idle. */
export function newLegacyCreditThreshold(code: string, title: string): LegacyCreditThreshold {
  return new LegacyCreditThreshold(code, title, 0, 0, 0, 0, "", "", "idle");
}
