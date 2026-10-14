/**
 * The adaptive flight override records of adops's flight work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a adaptive flight override is in its life cycle. */
export type AdaptiveFlightOverrideStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A adaptive flight override. Its code is unique within a tenant. */
export class AdaptiveFlightOverride {
  code: string;
  title: string;
  journeyId: string;
  externalRef: string;
  expiresAt: number;
  channel: string;
  cost: number;
  updatedAt: number;
  conversionRate: number;
  capacity: number;
  status: AdaptiveFlightOverrideStatus;

  constructor(
    code: string,
    title: string,
    journeyId: string,
    externalRef: string,
    expiresAt: number,
    channel: string,
    cost: number,
    updatedAt: number,
    conversionRate: number,
    capacity: number,
    status: AdaptiveFlightOverrideStatus,
  ) {
    this.code = code;
    this.title = title;
    this.journeyId = journeyId;
    this.externalRef = externalRef;
    this.expiresAt = expiresAt;
    this.channel = channel;
    this.cost = cost;
    this.updatedAt = updatedAt;
    this.conversionRate = conversionRate;
    this.capacity = capacity;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: AdaptiveFlightOverrideStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending" || next === "active";
      case "pending":
        return next === "suspended" || next === "closed";
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: AdaptiveFlightOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive flight override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  netValue(): number {
    return Math.round((this.cost - this.conversionRate) * 100) / 100;
  }

  copy(): AdaptiveFlightOverride {
    return new AdaptiveFlightOverride(
      this.code,
      this.title,
      this.journeyId,
      this.externalRef,
      this.expiresAt,
      this.channel,
      this.cost,
      this.updatedAt,
      this.conversionRate,
      this.capacity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a adaptive flight override in status draft. */
export function newAdaptiveFlightOverride(code: string, title: string): AdaptiveFlightOverride {
  return new AdaptiveFlightOverride(code, title, "", "", 0, "", 0, 0, 0, 0, "draft");
}
