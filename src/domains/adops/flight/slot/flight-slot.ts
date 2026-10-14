/**
 * The flight slot records of adops's flight work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a flight slot is in its life cycle. */
export type FlightSlotStatus = "new" | "queued" | "running" | "done" | "failed";

/** A flight slot. Its code is unique within a tenant. */
export class FlightSlot {
  code: string;
  title: string;
  pinned: boolean;
  tags: string[];
  checksum: string;
  locale: string;
  approved: boolean;
  maximum: number;
  country: string;
  frequencyCap: number;
  attempts: number;
  status: FlightSlotStatus;

  constructor(
    code: string,
    title: string,
    pinned: boolean,
    tags: string[],
    checksum: string,
    locale: string,
    approved: boolean,
    maximum: number,
    country: string,
    frequencyCap: number,
    attempts: number,
    status: FlightSlotStatus,
  ) {
    this.code = code;
    this.title = title;
    this.pinned = pinned;
    this.tags = tags;
    this.checksum = checksum;
    this.locale = locale;
    this.approved = approved;
    this.maximum = maximum;
    this.country = country;
    this.frequencyCap = frequencyCap;
    this.attempts = attempts;
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

  canMoveTo(next: FlightSlotStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "queued":
        return next === "running";
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: FlightSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`flight slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  adjustedExposure(): number {
    return Math.round((this.attempts - this.frequencyCap) * 100) / 100;
  }

  copy(): FlightSlot {
    return new FlightSlot(
      this.code,
      this.title,
      this.pinned,
      this.tags,
      this.checksum,
      this.locale,
      this.approved,
      this.maximum,
      this.country,
      this.frequencyCap,
      this.attempts,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a flight slot in status new. */
export function newFlightSlot(code: string, title: string): FlightSlot {
  return new FlightSlot(code, title, false, [], "", "", false, 0, "", 0, 0, "new");
}
