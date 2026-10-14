/**
 * The flight override records of adops's flight work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a flight override is in its life cycle. */
export type FlightOverrideStatus = "requested" | "granted" | "revoked" | "expired";

/** A flight override as the flight team keeps it. */
export class FlightOverride {
  code: string;
  title: string;
  bid: number;
  visible: boolean;
  tags: string[];
  ratio: number;
  locale: string;
  status: FlightOverrideStatus;

  constructor(
    code: string,
    title: string,
    bid: number,
    visible: boolean,
    tags: string[],
    ratio: number,
    locale: string,
    status: FlightOverrideStatus,
  ) {
    this.code = code;
    this.title = title;
    this.bid = bid;
    this.visible = visible;
    this.tags = tags;
    this.ratio = ratio;
    this.locale = locale;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: FlightOverrideStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "expired";
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: FlightOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`flight override ${this.code} cannot move from ${this.status} to ${next}`);
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

  effectiveValue(): number {
    return Math.round(this.ratio * this.bid * 100) / 100;
  }

  copy(): FlightOverride {
    return new FlightOverride(
      this.code,
      this.title,
      this.bid,
      this.visible,
      this.tags,
      this.ratio,
      this.locale,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a flight override in status requested. */
export function newFlightOverride(code: string, title: string): FlightOverride {
  return new FlightOverride(code, title, 0, false, [], 0, "", "requested");
}
