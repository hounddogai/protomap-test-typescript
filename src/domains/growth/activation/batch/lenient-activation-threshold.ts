import * as text from "../../../../kit/text.js";

/** Where a lenient activation threshold is in its life cycle. */
export type LenientActivationThresholdStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One lenient activation threshold, with what the planners need to act on it. */
export class LenientActivationThreshold {
  code: string;
  name: string;
  currency: string;
  contactEmail: string;
  floorValue: number;
  locale: string;
  budget: number;
  status: LenientActivationThresholdStatus;

  constructor(
    code: string,
    name: string,
    currency: string,
    contactEmail: string,
    floorValue: number,
    locale: string,
    budget: number,
    status: LenientActivationThresholdStatus,
  ) {
    this.code = code;
    this.name = name;
    this.currency = currency;
    this.contactEmail = contactEmail;
    this.floorValue = floorValue;
    this.locale = locale;
    this.budget = budget;
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

  canMoveTo(next: LenientActivationThresholdStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "ready";
      case "warming":
        return next === "ready" || next === "draining";
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

  moveTo(next: LenientActivationThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient activation threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  adjustedLoad(): number {
    return Math.round((this.floorValue - this.budget) * 100) / 100;
  }

  copy(): LenientActivationThreshold {
    return new LenientActivationThreshold(
      this.code,
      this.name,
      this.currency,
      this.contactEmail,
      this.floorValue,
      this.locale,
      this.budget,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a lenient activation threshold in status idle. */
export function newLenientActivationThreshold(code: string, name: string): LenientActivationThreshold {
  return new LenientActivationThreshold(code, name, "", "", 0, "", 0, "idle");
}
