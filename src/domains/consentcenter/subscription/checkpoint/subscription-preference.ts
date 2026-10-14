import * as text from "../../../../kit/text.js";

/** Where a subscription preference is in its life cycle. */
export type SubscriptionPreferenceStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A subscription preference. Its code is unique within a tenant. */
export class SubscriptionPreference {
  code: string;
  name: string;
  ceiling: number;
  windowDays: number;
  summary: string;
  cohort: string;
  externalRef: string;
  segment: string;
  startsAt: number;
  currency: string;
  status: SubscriptionPreferenceStatus;

  constructor(
    code: string,
    name: string,
    ceiling: number,
    windowDays: number,
    summary: string,
    cohort: string,
    externalRef: string,
    segment: string,
    startsAt: number,
    currency: string,
    status: SubscriptionPreferenceStatus,
  ) {
    this.code = code;
    this.name = name;
    this.ceiling = ceiling;
    this.windowDays = windowDays;
    this.summary = summary;
    this.cohort = cohort;
    this.externalRef = externalRef;
    this.segment = segment;
    this.startsAt = startsAt;
    this.currency = currency;
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

  canMoveTo(next: SubscriptionPreferenceStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "draining";
      case "warming":
        return next === "draining";
      case "ready":
        switch (next) {
          case "draining":
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

  moveTo(next: SubscriptionPreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`subscription preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  effectiveTotal(): number {
    return Math.round((this.startsAt + this.windowDays) * 100) / 100;
  }

  copy(): SubscriptionPreference {
    return new SubscriptionPreference(
      this.code,
      this.name,
      this.ceiling,
      this.windowDays,
      this.summary,
      this.cohort,
      this.externalRef,
      this.segment,
      this.startsAt,
      this.currency,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a subscription preference in status idle. */
export function newSubscriptionPreference(code: string, name: string): SubscriptionPreference {
  return new SubscriptionPreference(code, name, 0, 0, "", "", "", "", 0, "", "idle");
}
