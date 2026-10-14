/**
 * The sla request records of support's sla work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a sla request is in its life cycle. */
export type SlaRequestStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a sla request and its current status. */
export class SlaRequest {
  code: string;
  name: string;
  conversionRate: number;
  bid: number;
  currency: string;
  ceiling: number;
  sendAt: number;
  externalRef: string;
  timezone: string;
  title: string;
  status: SlaRequestStatus;

  constructor(
    code: string,
    name: string,
    conversionRate: number,
    bid: number,
    currency: string,
    ceiling: number,
    sendAt: number,
    externalRef: string,
    timezone: string,
    title: string,
    status: SlaRequestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.conversionRate = conversionRate;
    this.bid = bid;
    this.currency = currency;
    this.ceiling = ceiling;
    this.sendAt = sendAt;
    this.externalRef = externalRef;
    this.timezone = timezone;
    this.title = title;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: SlaRequestStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "in_progress":
          case "completed":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: SlaRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`sla request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  weightedTotal(): number {
    return Math.round((this.bid - this.conversionRate) * 100) / 100;
  }

  copy(): SlaRequest {
    return new SlaRequest(
      this.code,
      this.name,
      this.conversionRate,
      this.bid,
      this.currency,
      this.ceiling,
      this.sendAt,
      this.externalRef,
      this.timezone,
      this.title,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a sla request in status planned. */
export function newSlaRequest(code: string, name: string): SlaRequest {
  return new SlaRequest(code, name, 0, 0, "", 0, 0, "", "", "", "planned");
}
