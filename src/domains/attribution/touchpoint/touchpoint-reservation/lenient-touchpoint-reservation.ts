/**
 * The lenient touchpoint reservation records of attribution's touchpoint work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a lenient touchpoint reservation is in its life cycle. */
export type LenientTouchpointReservationStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a lenient touchpoint reservation and its current status. */
export class LenientTouchpointReservation {
  code: string;
  title: string;
  ratio: number;
  journeyId: string;
  batchSize: number;
  locale: string;
  status: LenientTouchpointReservationStatus;

  constructor(
    code: string,
    title: string,
    ratio: number,
    journeyId: string,
    batchSize: number,
    locale: string,
    status: LenientTouchpointReservationStatus,
  ) {
    this.code = code;
    this.title = title;
    this.ratio = ratio;
    this.journeyId = journeyId;
    this.batchSize = batchSize;
    this.locale = locale;
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

  canMoveTo(next: LenientTouchpointReservationStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "resolved";
      case "in_review":
        switch (next) {
          case "resolved":
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LenientTouchpointReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient touchpoint reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  effectiveValue(): number {
    return Math.round((this.batchSize + this.ratio) * 100) / 100;
  }

  copy(): LenientTouchpointReservation {
    return new LenientTouchpointReservation(
      this.code,
      this.title,
      this.ratio,
      this.journeyId,
      this.batchSize,
      this.locale,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a lenient touchpoint reservation in status open. */
export function newLenientTouchpointReservation(code: string, title: string): LenientTouchpointReservation {
  return new LenientTouchpointReservation(code, title, 0, "", 0, "", "open");
}
