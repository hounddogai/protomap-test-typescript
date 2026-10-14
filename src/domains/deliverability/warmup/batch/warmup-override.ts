import * as text from "../../../../kit/text.js";

/** Where a warmup override is in its life cycle. */
export type WarmupOverrideStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a warmup override and its current status. */
export class WarmupOverride {
  code: string;
  name: string;
  startsAt: number;
  locale: string;
  currency: string;
  status: WarmupOverrideStatus;

  constructor(
    code: string,
    name: string,
    startsAt: number,
    locale: string,
    currency: string,
    status: WarmupOverrideStatus,
  ) {
    this.code = code;
    this.name = name;
    this.startsAt = startsAt;
    this.locale = locale;
    this.currency = currency;
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

  canMoveTo(next: WarmupOverrideStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted";
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: WarmupOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`warmup override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  measuredValue(): number {
    return this.startsAt;
  }

  copy(): WarmupOverride {
    return new WarmupOverride(this.code, this.name, this.startsAt, this.locale, this.currency, this.status);
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a warmup override in status requested. */
export function newWarmupOverride(code: string, name: string): WarmupOverride {
  return new WarmupOverride(code, name, 0, "", "", "requested");
}
