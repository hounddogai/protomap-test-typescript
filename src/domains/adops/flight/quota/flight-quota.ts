/**
 * The flight quota records of adops's flight work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a flight quota is in its life cycle. */
export type FlightQuotaStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a flight quota and its current status. */
export class FlightQuota {
  code: string;
  name: string;
  attributes: Map<string, string>;
  sendAt: number;
  title: string;
  segment: string;
  status: FlightQuotaStatus;

  constructor(
    code: string,
    name: string,
    attributes: Map<string, string>,
    sendAt: number,
    title: string,
    segment: string,
    status: FlightQuotaStatus,
  ) {
    this.code = code;
    this.name = name;
    this.attributes = attributes;
    this.sendAt = sendAt;
    this.title = title;
    this.segment = segment;
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

  canMoveTo(next: FlightQuotaStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "revoked":
            return true;
        }
        return false;
      case "granted":
        return next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FlightQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`flight quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  measuredValue(): number {
    return this.sendAt;
  }

  copy(): FlightQuota {
    return new FlightQuota(this.code, this.name, this.attributes, this.sendAt, this.title, this.segment, this.status);
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a flight quota in status requested. */
export function newFlightQuota(code: string, name: string): FlightQuota {
  return new FlightQuota(code, name, new Map<string, string>(), 0, "", "", "requested");
}
