/**
 * The default preference reservation records of consentcenter's preference work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a default preference reservation is in its life cycle. */
export type DefaultPreferenceReservationStatus = "new" | "queued" | "running" | "done" | "failed";

/** A default preference reservation as the preference team keeps it. */
export class DefaultPreferenceReservation {
  code: string;
  label: string;
  revision: number;
  floorValue: number;
  locale: string;
  variant: string;
  minimum: number;
  name: string;
  sequence: number;
  status: DefaultPreferenceReservationStatus;

  constructor(
    code: string,
    label: string,
    revision: number,
    floorValue: number,
    locale: string,
    variant: string,
    minimum: number,
    name: string,
    sequence: number,
    status: DefaultPreferenceReservationStatus,
  ) {
    this.code = code;
    this.label = label;
    this.revision = revision;
    this.floorValue = floorValue;
    this.locale = locale;
    this.variant = variant;
    this.minimum = minimum;
    this.name = name;
    this.sequence = sequence;
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

  canMoveTo(next: DefaultPreferenceReservationStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "done" || next === "failed";
      case "queued":
        return next === "done" || next === "failed";
      case "running":
        return next === "done" || next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: DefaultPreferenceReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default preference reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  netLoad(): number {
    return Math.round((this.minimum + this.revision) * 100) / 100;
  }

  copy(): DefaultPreferenceReservation {
    return new DefaultPreferenceReservation(
      this.code,
      this.label,
      this.revision,
      this.floorValue,
      this.locale,
      this.variant,
      this.minimum,
      this.name,
      this.sequence,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a default preference reservation in status new. */
export function newDefaultPreferenceReservation(code: string, label: string): DefaultPreferenceReservation {
  return new DefaultPreferenceReservation(code, label, 0, 0, "", "", 0, "", 0, "new");
}
