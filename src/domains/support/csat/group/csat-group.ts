/**
 * The csat group records of support's csat work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a csat group is in its life cycle. */
export type CsatGroupStatus = "requested" | "granted" | "revoked" | "expired";

/** A csat group as the csat team keeps it. */
export class CsatGroup {
  code: string;
  title: string;
  locale: string;
  batchSize: number;
  amount: number;
  durationMinutes: number;
  utmSource: string;
  status: CsatGroupStatus;

  constructor(
    code: string,
    title: string,
    locale: string,
    batchSize: number,
    amount: number,
    durationMinutes: number,
    utmSource: string,
    status: CsatGroupStatus,
  ) {
    this.code = code;
    this.title = title;
    this.locale = locale;
    this.batchSize = batchSize;
    this.amount = amount;
    this.durationMinutes = durationMinutes;
    this.utmSource = utmSource;
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

  canMoveTo(next: CsatGroupStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "expired":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: CsatGroupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`csat group ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  adjustedExposure(): number {
    return Math.round((this.batchSize + this.amount) * 100) / 100;
  }

  copy(): CsatGroup {
    return new CsatGroup(
      this.code,
      this.title,
      this.locale,
      this.batchSize,
      this.amount,
      this.durationMinutes,
      this.utmSource,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a csat group in status requested. */
export function newCsatGroup(code: string, title: string): CsatGroup {
  return new CsatGroup(code, title, "", 0, 0, 0, "", "requested");
}
