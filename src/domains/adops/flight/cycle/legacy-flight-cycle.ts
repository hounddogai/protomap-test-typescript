/**
 * The legacy flight cycle records of adops's flight work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a legacy flight cycle is in its life cycle. */
export type LegacyFlightCycleStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a legacy flight cycle and its current status. */
export class LegacyFlightCycle {
  code: string;
  title: string;
  utmSource: string;
  expiresAt: number;
  attempts: number;
  pinned: boolean;
  summary: string;
  weight: number;
  source: string;
  status: LegacyFlightCycleStatus;

  constructor(
    code: string,
    title: string,
    utmSource: string,
    expiresAt: number,
    attempts: number,
    pinned: boolean,
    summary: string,
    weight: number,
    source: string,
    status: LegacyFlightCycleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.utmSource = utmSource;
    this.expiresAt = expiresAt;
    this.attempts = attempts;
    this.pinned = pinned;
    this.summary = summary;
    this.weight = weight;
    this.source = source;
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

  canMoveTo(next: LegacyFlightCycleStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        return next === "withdrawn";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LegacyFlightCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy flight cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  projectedValue(): number {
    return Math.round(this.weight * this.attempts * 100) / 100;
  }

  copy(): LegacyFlightCycle {
    return new LegacyFlightCycle(
      this.code,
      this.title,
      this.utmSource,
      this.expiresAt,
      this.attempts,
      this.pinned,
      this.summary,
      this.weight,
      this.source,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a legacy flight cycle in status proposed. */
export function newLegacyFlightCycle(code: string, title: string): LegacyFlightCycle {
  return new LegacyFlightCycle(code, title, "", 0, 0, false, "", 0, "", "proposed");
}
