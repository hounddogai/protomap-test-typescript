/**
 * The default touchpoint reservation records of attribution's touchpoint work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a default touchpoint reservation is in its life cycle. */
export type DefaultTouchpointReservationStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A default touchpoint reservation as the touchpoint team keeps it. */
export class DefaultTouchpointReservation {
  code: string;
  label: string;
  clicks: number;
  cohort: string;
  attributes: Map<string, string>;
  startsAt: number;
  status: DefaultTouchpointReservationStatus;

  constructor(
    code: string,
    label: string,
    clicks: number,
    cohort: string,
    attributes: Map<string, string>,
    startsAt: number,
    status: DefaultTouchpointReservationStatus,
  ) {
    this.code = code;
    this.label = label;
    this.clicks = clicks;
    this.cohort = cohort;
    this.attributes = attributes;
    this.startsAt = startsAt;
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

  canMoveTo(next: DefaultTouchpointReservationStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "resolved";
      case "in_review":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        return next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: DefaultTouchpointReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default touchpoint reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  adjustedExposure(): number {
    return Math.round((this.startsAt + this.clicks) * 100) / 100;
  }

  copy(): DefaultTouchpointReservation {
    return new DefaultTouchpointReservation(
      this.code,
      this.label,
      this.clicks,
      this.cohort,
      this.attributes,
      this.startsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a default touchpoint reservation in status open. */
export function newDefaultTouchpointReservation(code: string, label: string): DefaultTouchpointReservation {
  return new DefaultTouchpointReservation(code, label, 0, "", new Map<string, string>(), 0, "open");
}
