/**
 * The manual conversion reservation records of attribution's conversion work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a manual conversion reservation is in its life cycle. */
export type ManualConversionReservationStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a manual conversion reservation and its current status. */
export class ManualConversionReservation {
  code: string;
  name: string;
  expiresAt: number;
  clicks: number;
  summary: string;
  audienceId: string;
  status: ManualConversionReservationStatus;

  constructor(
    code: string,
    name: string,
    expiresAt: number,
    clicks: number,
    summary: string,
    audienceId: string,
    status: ManualConversionReservationStatus,
  ) {
    this.code = code;
    this.name = name;
    this.expiresAt = expiresAt;
    this.clicks = clicks;
    this.summary = summary;
    this.audienceId = audienceId;
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

  canMoveTo(next: ManualConversionReservationStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "revoked";
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

  moveTo(next: ManualConversionReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual conversion reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"manual conversion reservation"} ${this.code}`;
  }

  effectiveValue(): number {
    return Math.round(this.expiresAt * this.clicks * 100) / 100;
  }

  copy(): ManualConversionReservation {
    return new ManualConversionReservation(
      this.code,
      this.name,
      this.expiresAt,
      this.clicks,
      this.summary,
      this.audienceId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a manual conversion reservation in status requested. */
export function newManualConversionReservation(code: string, name: string): ManualConversionReservation {
  return new ManualConversionReservation(code, name, 0, 0, "", "", "requested");
}
