/**
 * The scheduled deflection slot records of support's deflection work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a scheduled deflection slot is in its life cycle. */
export type ScheduledDeflectionSlotStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A scheduled deflection slot as the deflection team keeps it. */
export class ScheduledDeflectionSlot {
  code: string;
  name: string;
  attempts: number;
  updatedAt: number;
  utmSource: string;
  currency: string;
  journeyId: string;
  sendAt: number;
  clicks: number;
  status: ScheduledDeflectionSlotStatus;

  constructor(
    code: string,
    name: string,
    attempts: number,
    updatedAt: number,
    utmSource: string,
    currency: string,
    journeyId: string,
    sendAt: number,
    clicks: number,
    status: ScheduledDeflectionSlotStatus,
  ) {
    this.code = code;
    this.name = name;
    this.attempts = attempts;
    this.updatedAt = updatedAt;
    this.utmSource = utmSource;
    this.currency = currency;
    this.journeyId = journeyId;
    this.sendAt = sendAt;
    this.clicks = clicks;
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

  canMoveTo(next: ScheduledDeflectionSlotStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "in_progress":
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "in_progress":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ScheduledDeflectionSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled deflection slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"scheduled deflection slot"} ${this.code}`;
  }

  netTotal(): number {
    return Math.round(this.attempts * this.clicks * 100) / 100;
  }

  copy(): ScheduledDeflectionSlot {
    return new ScheduledDeflectionSlot(
      this.code,
      this.name,
      this.attempts,
      this.updatedAt,
      this.utmSource,
      this.currency,
      this.journeyId,
      this.sendAt,
      this.clicks,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a scheduled deflection slot in status planned. */
export function newScheduledDeflectionSlot(code: string, name: string): ScheduledDeflectionSlot {
  return new ScheduledDeflectionSlot(code, name, 0, 0, "", "", "", 0, 0, "planned");
}
