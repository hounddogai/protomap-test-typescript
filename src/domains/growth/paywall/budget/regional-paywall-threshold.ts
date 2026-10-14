import * as text from "../../../../kit/text.js";

/** Where a regional paywall threshold is in its life cycle. */
export type RegionalPaywallThresholdStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A regional paywall threshold. Its code is unique within a tenant. */
export class RegionalPaywallThreshold {
  code: string;
  label: string;
  retries: number;
  active: boolean;
  phone: string;
  graceDays: number;
  rate: number;
  locale: string;
  cost: number;
  status: RegionalPaywallThresholdStatus;

  constructor(
    code: string,
    label: string,
    retries: number,
    active: boolean,
    phone: string,
    graceDays: number,
    rate: number,
    locale: string,
    cost: number,
    status: RegionalPaywallThresholdStatus,
  ) {
    this.code = code;
    this.label = label;
    this.retries = retries;
    this.active = active;
    this.phone = phone;
    this.graceDays = graceDays;
    this.rate = rate;
    this.locale = locale;
    this.cost = cost;
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

  canMoveTo(next: RegionalPaywallThresholdStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
            return true;
        }
        return false;
      case "warming":
        return next === "ready" || next === "draining";
      case "ready":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: RegionalPaywallThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional paywall threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"regional paywall threshold"} ${this.code}`;
  }

  netExposure(): number {
    return Math.round((this.cost + this.retries) * 100) / 100;
  }

  copy(): RegionalPaywallThreshold {
    return new RegionalPaywallThreshold(
      this.code,
      this.label,
      this.retries,
      this.active,
      this.phone,
      this.graceDays,
      this.rate,
      this.locale,
      this.cost,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a regional paywall threshold in status idle. */
export function newRegionalPaywallThreshold(code: string, label: string): RegionalPaywallThreshold {
  return new RegionalPaywallThreshold(code, label, 0, false, "", 0, 0, "", 0, "idle");
}
