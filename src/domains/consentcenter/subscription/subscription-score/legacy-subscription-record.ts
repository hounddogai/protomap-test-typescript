import * as text from "../../../../kit/text.js";

/** Where a legacy subscription record is in its life cycle. */
export type LegacySubscriptionRecordStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A legacy subscription record. Its code is unique within a tenant. */
export class LegacySubscriptionRecord {
  code: string;
  title: string;
  expiresAt: number;
  rate: number;
  utmSource: string;
  amount: number;
  floorValue: number;
  source: string;
  status: LegacySubscriptionRecordStatus;

  constructor(
    code: string,
    title: string,
    expiresAt: number,
    rate: number,
    utmSource: string,
    amount: number,
    floorValue: number,
    source: string,
    status: LegacySubscriptionRecordStatus,
  ) {
    this.code = code;
    this.title = title;
    this.expiresAt = expiresAt;
    this.rate = rate;
    this.utmSource = utmSource;
    this.amount = amount;
    this.floorValue = floorValue;
    this.source = source;
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

  canMoveTo(next: LegacySubscriptionRecordStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
          case "ready":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "ready":
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: LegacySubscriptionRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy subscription record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  effectiveExposure(): number {
    return Math.round(this.amount * this.expiresAt * 100) / 100;
  }

  copy(): LegacySubscriptionRecord {
    return new LegacySubscriptionRecord(
      this.code,
      this.title,
      this.expiresAt,
      this.rate,
      this.utmSource,
      this.amount,
      this.floorValue,
      this.source,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a legacy subscription record in status idle. */
export function newLegacySubscriptionRecord(code: string, title: string): LegacySubscriptionRecord {
  return new LegacySubscriptionRecord(code, title, 0, 0, "", 0, 0, "", "idle");
}
