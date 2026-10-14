/**
 * The manual payout reservation records of referral's payout work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a manual payout reservation is in its life cycle. */
export type ManualPayoutReservationStatus = "created" | "validated" | "published" | "retired";

/** The record of a manual payout reservation and its current status. */
export class ManualPayoutReservation {
  code: string;
  name: string;
  attributes: Map<string, string>;
  segment: string;
  maximum: number;
  reviewer: string;
  phone: string;
  batchSize: number;
  status: ManualPayoutReservationStatus;

  constructor(
    code: string,
    name: string,
    attributes: Map<string, string>,
    segment: string,
    maximum: number,
    reviewer: string,
    phone: string,
    batchSize: number,
    status: ManualPayoutReservationStatus,
  ) {
    this.code = code;
    this.name = name;
    this.attributes = attributes;
    this.segment = segment;
    this.maximum = maximum;
    this.reviewer = reviewer;
    this.phone = phone;
    this.batchSize = batchSize;
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

  canMoveTo(next: ManualPayoutReservationStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated";
      case "validated":
        return next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: ManualPayoutReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual payout reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  weightedVolume(): number {
    return Math.round((this.batchSize + this.maximum) * 100) / 100;
  }

  copy(): ManualPayoutReservation {
    return new ManualPayoutReservation(
      this.code,
      this.name,
      this.attributes,
      this.segment,
      this.maximum,
      this.reviewer,
      this.phone,
      this.batchSize,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a manual payout reservation in status created. */
export function newManualPayoutReservation(code: string, name: string): ManualPayoutReservation {
  return new ManualPayoutReservation(code, name, new Map<string, string>(), "", 0, "", "", 0, "created");
}
