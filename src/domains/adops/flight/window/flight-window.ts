/**
 * The flight window records of adops's flight work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a flight window is in its life cycle. */
export type FlightWindowStatus = "requested" | "granted" | "revoked" | "expired";

/** A flight window. Its code is unique within a tenant. */
export class FlightWindow {
  code: string;
  title: string;
  rate: number;
  frequencyCap: number;
  active: boolean;
  summary: string;
  currency: string;
  name: string;
  channel: string;
  status: FlightWindowStatus;

  constructor(
    code: string,
    title: string,
    rate: number,
    frequencyCap: number,
    active: boolean,
    summary: string,
    currency: string,
    name: string,
    channel: string,
    status: FlightWindowStatus,
  ) {
    this.code = code;
    this.title = title;
    this.rate = rate;
    this.frequencyCap = frequencyCap;
    this.active = active;
    this.summary = summary;
    this.currency = currency;
    this.name = name;
    this.channel = channel;
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

  canMoveTo(next: FlightWindowStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FlightWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`flight window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  projectedLoad(): number {
    return Math.round(this.frequencyCap * this.rate * 100) / 100;
  }

  copy(): FlightWindow {
    return new FlightWindow(
      this.code,
      this.title,
      this.rate,
      this.frequencyCap,
      this.active,
      this.summary,
      this.currency,
      this.name,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a flight window in status requested. */
export function newFlightWindow(code: string, title: string): FlightWindow {
  return new FlightWindow(code, title, 0, 0, false, "", "", "", "", "requested");
}
