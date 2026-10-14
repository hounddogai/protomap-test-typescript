/**
 * The fallback post reservation records of social's post work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a fallback post reservation is in its life cycle. */
export type FallbackPostReservationStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A fallback post reservation as the post team keeps it. */
export class FallbackPostReservation {
  code: string;
  label: string;
  reviewer: string;
  ceiling: number;
  category: string;
  unit: string;
  status: FallbackPostReservationStatus;

  constructor(
    code: string,
    label: string,
    reviewer: string,
    ceiling: number,
    category: string,
    unit: string,
    status: FallbackPostReservationStatus,
  ) {
    this.code = code;
    this.label = label;
    this.reviewer = reviewer;
    this.ceiling = ceiling;
    this.category = category;
    this.unit = unit;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: FallbackPostReservationStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        return next === "ready" || next === "stopped";
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FallbackPostReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback post reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  measuredValue(): number {
    return this.ceiling;
  }

  copy(): FallbackPostReservation {
    return new FallbackPostReservation(
      this.code,
      this.label,
      this.reviewer,
      this.ceiling,
      this.category,
      this.unit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a fallback post reservation in status idle. */
export function newFallbackPostReservation(code: string, label: string): FallbackPostReservation {
  return new FallbackPostReservation(code, label, "", 0, "", "", "idle");
}
