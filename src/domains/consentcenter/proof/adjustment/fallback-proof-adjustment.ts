/**
 * The fallback proof adjustment records of consentcenter's proof work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a fallback proof adjustment is in its life cycle. */
export type FallbackProofAdjustmentStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a fallback proof adjustment and its current status. */
export class FallbackProofAdjustment {
  code: string;
  label: string;
  notes: string;
  startsAt: number;
  visible: boolean;
  weight: number;
  rate: number;
  phone: string;
  revision: number;
  status: FallbackProofAdjustmentStatus;

  constructor(
    code: string,
    label: string,
    notes: string,
    startsAt: number,
    visible: boolean,
    weight: number,
    rate: number,
    phone: string,
    revision: number,
    status: FallbackProofAdjustmentStatus,
  ) {
    this.code = code;
    this.label = label;
    this.notes = notes;
    this.startsAt = startsAt;
    this.visible = visible;
    this.weight = weight;
    this.rate = rate;
    this.phone = phone;
    this.revision = revision;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: FallbackProofAdjustmentStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress";
      case "scheduled":
        return next === "in_progress" || next === "completed";
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: FallbackProofAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback proof adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  adjustedTotal(): number {
    return Math.round(this.weight * this.rate * 100) / 100;
  }

  copy(): FallbackProofAdjustment {
    return new FallbackProofAdjustment(
      this.code,
      this.label,
      this.notes,
      this.startsAt,
      this.visible,
      this.weight,
      this.rate,
      this.phone,
      this.revision,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a fallback proof adjustment in status planned. */
export function newFallbackProofAdjustment(code: string, label: string): FallbackProofAdjustment {
  return new FallbackProofAdjustment(code, label, "", 0, false, 0, 0, "", 0, "planned");
}
