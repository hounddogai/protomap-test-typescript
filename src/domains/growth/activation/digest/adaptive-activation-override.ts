import * as text from "../../../../kit/text.js";

/** Where a adaptive activation override is in its life cycle. */
export type AdaptiveActivationOverrideStatus = "new" | "queued" | "running" | "done" | "failed";

/** One adaptive activation override, with what the planners need to act on it. */
export class AdaptiveActivationOverride {
  code: string;
  name: string;
  active: boolean;
  country: string;
  createdAt: number;
  rate: number;
  phone: string;
  endsAt: number;
  locale: string;
  variant: string;
  status: AdaptiveActivationOverrideStatus;

  constructor(
    code: string,
    name: string,
    active: boolean,
    country: string,
    createdAt: number,
    rate: number,
    phone: string,
    endsAt: number,
    locale: string,
    variant: string,
    status: AdaptiveActivationOverrideStatus,
  ) {
    this.code = code;
    this.name = name;
    this.active = active;
    this.country = country;
    this.createdAt = createdAt;
    this.rate = rate;
    this.phone = phone;
    this.endsAt = endsAt;
    this.locale = locale;
    this.variant = variant;
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

  canMoveTo(next: AdaptiveActivationOverrideStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "running":
          case "failed":
            return true;
        }
        return false;
      case "running":
        return next === "done" || next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: AdaptiveActivationOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive activation override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  projectedExposure(): number {
    return Math.round(this.endsAt * this.rate * 100) / 100;
  }

  copy(): AdaptiveActivationOverride {
    return new AdaptiveActivationOverride(
      this.code,
      this.name,
      this.active,
      this.country,
      this.createdAt,
      this.rate,
      this.phone,
      this.endsAt,
      this.locale,
      this.variant,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a adaptive activation override in status new. */
export function newAdaptiveActivationOverride(code: string, name: string): AdaptiveActivationOverride {
  return new AdaptiveActivationOverride(code, name, false, "", 0, 0, "", 0, "", "", "new");
}
