/**
 * The pending conversion reservation records of attribution's conversion work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a pending conversion reservation is in its life cycle. */
export type PendingConversionReservationStatus = "created" | "validated" | "published" | "retired";

/** One pending conversion reservation, with what the planners need to act on it. */
export class PendingConversionReservation {
  code: string;
  label: string;
  segment: string;
  threshold: number;
  endsAt: number;
  attributes: Map<string, string>;
  margin: number;
  status: PendingConversionReservationStatus;

  constructor(
    code: string,
    label: string,
    segment: string,
    threshold: number,
    endsAt: number,
    attributes: Map<string, string>,
    margin: number,
    status: PendingConversionReservationStatus,
  ) {
    this.code = code;
    this.label = label;
    this.segment = segment;
    this.threshold = threshold;
    this.endsAt = endsAt;
    this.attributes = attributes;
    this.margin = margin;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: PendingConversionReservationStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: PendingConversionReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending conversion reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  netTotal(): number {
    return Math.round((this.endsAt - this.threshold) * 100) / 100;
  }

  copy(): PendingConversionReservation {
    return new PendingConversionReservation(
      this.code,
      this.label,
      this.segment,
      this.threshold,
      this.endsAt,
      this.attributes,
      this.margin,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a pending conversion reservation in status created. */
export function newPendingConversionReservation(code: string, label: string): PendingConversionReservation {
  return new PendingConversionReservation(code, label, "", 0, 0, new Map<string, string>(), 0, "created");
}
