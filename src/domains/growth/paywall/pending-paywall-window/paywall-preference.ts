import * as text from "../../../../kit/text.js";

/** Where a paywall preference is in its life cycle. */
export type PaywallPreferenceStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One paywall preference, with what the planners need to act on it. */
export class PaywallPreference {
  code: string;
  title: string;
  locale: string;
  budget: number;
  retries: number;
  unit: string;
  utmSource: string;
  status: PaywallPreferenceStatus;

  constructor(
    code: string,
    title: string,
    locale: string,
    budget: number,
    retries: number,
    unit: string,
    utmSource: string,
    status: PaywallPreferenceStatus,
  ) {
    this.code = code;
    this.title = title;
    this.locale = locale;
    this.budget = budget;
    this.retries = retries;
    this.unit = unit;
    this.utmSource = utmSource;
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

  canMoveTo(next: PaywallPreferenceStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "draining";
      case "warming":
        return next === "ready" || next === "draining";
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PaywallPreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`paywall preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  effectiveValue(): number {
    return Math.round(this.retries * this.budget * 100) / 100;
  }

  copy(): PaywallPreference {
    return new PaywallPreference(
      this.code,
      this.title,
      this.locale,
      this.budget,
      this.retries,
      this.unit,
      this.utmSource,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a paywall preference in status idle. */
export function newPaywallPreference(code: string, title: string): PaywallPreference {
  return new PaywallPreference(code, title, "", 0, 0, "", "", "idle");
}
