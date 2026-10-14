/**
 * The seasonal queue reservation records of social's queue work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a seasonal queue reservation is in its life cycle. */
export type SeasonalQueueReservationStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a seasonal queue reservation and its current status. */
export class SeasonalQueueReservation {
  code: string;
  label: string;
  score: number;
  startsAt: number;
  locale: string;
  retries: number;
  quantity: number;
  channel: string;
  currency: string;
  approved: boolean;
  status: SeasonalQueueReservationStatus;

  constructor(
    code: string,
    label: string,
    score: number,
    startsAt: number,
    locale: string,
    retries: number,
    quantity: number,
    channel: string,
    currency: string,
    approved: boolean,
    status: SeasonalQueueReservationStatus,
  ) {
    this.code = code;
    this.label = label;
    this.score = score;
    this.startsAt = startsAt;
    this.locale = locale;
    this.retries = retries;
    this.quantity = quantity;
    this.channel = channel;
    this.currency = currency;
    this.approved = approved;
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

  canMoveTo(next: SeasonalQueueReservationStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: SeasonalQueueReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal queue reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  effectiveLoad(): number {
    return Math.round(this.quantity * this.startsAt * 100) / 100;
  }

  copy(): SeasonalQueueReservation {
    return new SeasonalQueueReservation(
      this.code,
      this.label,
      this.score,
      this.startsAt,
      this.locale,
      this.retries,
      this.quantity,
      this.channel,
      this.currency,
      this.approved,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a seasonal queue reservation in status idle. */
export function newSeasonalQueueReservation(code: string, label: string): SeasonalQueueReservation {
  return new SeasonalQueueReservation(code, label, 0, 0, "", 0, 0, "", "", false, "idle");
}
