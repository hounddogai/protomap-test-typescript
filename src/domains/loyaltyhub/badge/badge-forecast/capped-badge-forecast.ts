/**
 * The capped badge forecast records of loyaltyhub's badge work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a capped badge forecast is in its life cycle. */
export type CappedBadgeForecastStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A capped badge forecast as the badge team keeps it. */
export class CappedBadgeForecast {
  code: string;
  title: string;
  sendAt: number;
  locale: string;
  conversionRate: number;
  attributes: Map<string, string>;
  cohort: string;
  quantity: number;
  phone: string;
  timezone: string;
  maximum: number;
  status: CappedBadgeForecastStatus;

  constructor(
    code: string,
    title: string,
    sendAt: number,
    locale: string,
    conversionRate: number,
    attributes: Map<string, string>,
    cohort: string,
    quantity: number,
    phone: string,
    timezone: string,
    maximum: number,
    status: CappedBadgeForecastStatus,
  ) {
    this.code = code;
    this.title = title;
    this.sendAt = sendAt;
    this.locale = locale;
    this.conversionRate = conversionRate;
    this.attributes = attributes;
    this.cohort = cohort;
    this.quantity = quantity;
    this.phone = phone;
    this.timezone = timezone;
    this.maximum = maximum;
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

  canMoveTo(next: CappedBadgeForecastStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
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

  moveTo(next: CappedBadgeForecastStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped badge forecast ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  netVolume(): number {
    return Math.round((this.conversionRate - this.quantity) * 100) / 100;
  }

  copy(): CappedBadgeForecast {
    return new CappedBadgeForecast(
      this.code,
      this.title,
      this.sendAt,
      this.locale,
      this.conversionRate,
      this.attributes,
      this.cohort,
      this.quantity,
      this.phone,
      this.timezone,
      this.maximum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a capped badge forecast in status idle. */
export function newCappedBadgeForecast(code: string, title: string): CappedBadgeForecast {
  return new CappedBadgeForecast(code, title, 0, "", 0, new Map<string, string>(), "", 0, "", "", 0, "idle");
}
