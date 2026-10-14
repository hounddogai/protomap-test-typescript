/**
 * The reply reservation records of social's reply work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a reply reservation is in its life cycle. */
export type ReplyReservationStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a reply reservation and its current status. */
export class ReplyReservation {
  code: string;
  name: string;
  country: string;
  currency: string;
  batchSize: number;
  frequencyCap: number;
  unit: string;
  segment: string;
  capacity: number;
  status: ReplyReservationStatus;

  constructor(
    code: string,
    name: string,
    country: string,
    currency: string,
    batchSize: number,
    frequencyCap: number,
    unit: string,
    segment: string,
    capacity: number,
    status: ReplyReservationStatus,
  ) {
    this.code = code;
    this.name = name;
    this.country = country;
    this.currency = currency;
    this.batchSize = batchSize;
    this.frequencyCap = frequencyCap;
    this.unit = unit;
    this.segment = segment;
    this.capacity = capacity;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: ReplyReservationStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "resolved":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ReplyReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reply reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  adjustedExposure(): number {
    return Math.round(this.capacity * this.batchSize * 100) / 100;
  }

  copy(): ReplyReservation {
    return new ReplyReservation(
      this.code,
      this.name,
      this.country,
      this.currency,
      this.batchSize,
      this.frequencyCap,
      this.unit,
      this.segment,
      this.capacity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a reply reservation in status open. */
export function newReplyReservation(code: string, name: string): ReplyReservation {
  return new ReplyReservation(code, name, "", "", 0, 0, "", "", 0, "open");
}
