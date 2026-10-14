/**
 * The primary sla reservation records of support's sla work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a primary sla reservation is in its life cycle. */
export type PrimarySlaReservationStatus = "requested" | "granted" | "revoked" | "expired";

/** A primary sla reservation as the sla team keeps it. */
export class PrimarySlaReservation {
  code: string;
  name: string;
  floorValue: number;
  journeyId: string;
  updatedAt: number;
  margin: number;
  locale: string;
  version: number;
  status: PrimarySlaReservationStatus;

  constructor(
    code: string,
    name: string,
    floorValue: number,
    journeyId: string,
    updatedAt: number,
    margin: number,
    locale: string,
    version: number,
    status: PrimarySlaReservationStatus,
  ) {
    this.code = code;
    this.name = name;
    this.floorValue = floorValue;
    this.journeyId = journeyId;
    this.updatedAt = updatedAt;
    this.margin = margin;
    this.locale = locale;
    this.version = version;
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

  canMoveTo(next: PrimarySlaReservationStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "expired":
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

  moveTo(next: PrimarySlaReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary sla reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  label(): string {
    return `${"primary sla reservation"} ${this.code}`;
  }

  netExposure(): number {
    return Math.round((this.floorValue - this.version) * 100) / 100;
  }

  copy(): PrimarySlaReservation {
    return new PrimarySlaReservation(
      this.code,
      this.name,
      this.floorValue,
      this.journeyId,
      this.updatedAt,
      this.margin,
      this.locale,
      this.version,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a primary sla reservation in status requested. */
export function newPrimarySlaReservation(code: string, name: string): PrimarySlaReservation {
  return new PrimarySlaReservation(code, name, 0, "", 0, 0, "", 0, "requested");
}
