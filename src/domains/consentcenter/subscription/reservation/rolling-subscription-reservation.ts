/**
 * The rolling subscription reservation records of consentcenter's subscription work, and the rules, stores,
 * and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a rolling subscription reservation is in its life cycle. */
export type RollingSubscriptionReservationStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A rolling subscription reservation. Its code is unique within a tenant. */
export class RollingSubscriptionReservation {
  code: string;
  name: string;
  channel: string;
  externalRef: string;
  locale: string;
  source: string;
  tags: string[];
  sendAt: number;
  windowDays: number;
  clicks: number;
  status: RollingSubscriptionReservationStatus;

  constructor(
    code: string,
    name: string,
    channel: string,
    externalRef: string,
    locale: string,
    source: string,
    tags: string[],
    sendAt: number,
    windowDays: number,
    clicks: number,
    status: RollingSubscriptionReservationStatus,
  ) {
    this.code = code;
    this.name = name;
    this.channel = channel;
    this.externalRef = externalRef;
    this.locale = locale;
    this.source = source;
    this.tags = tags;
    this.sendAt = sendAt;
    this.windowDays = windowDays;
    this.clicks = clicks;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: RollingSubscriptionReservationStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
          case "rejected":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: RollingSubscriptionReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling subscription reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  weightedTotal(): number {
    return Math.round((this.sendAt - this.clicks) * 100) / 100;
  }

  copy(): RollingSubscriptionReservation {
    return new RollingSubscriptionReservation(
      this.code,
      this.name,
      this.channel,
      this.externalRef,
      this.locale,
      this.source,
      this.tags,
      this.sendAt,
      this.windowDays,
      this.clicks,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a rolling subscription reservation in status proposed. */
export function newRollingSubscriptionReservation(code: string, name: string): RollingSubscriptionReservation {
  return new RollingSubscriptionReservation(code, name, "", "", "", "", [], 0, 0, 0, "proposed");
}
