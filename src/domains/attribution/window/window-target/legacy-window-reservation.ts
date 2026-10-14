import * as text from "../../../../kit/text.js";

/** Where a legacy window reservation is in its life cycle. */
export type LegacyWindowReservationStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a legacy window reservation and its current status. */
export class LegacyWindowReservation {
  code: string;
  label: string;
  notes: string;
  reviewer: string;
  conversionRate: number;
  impressions: number;
  score: number;
  active: boolean;
  threshold: number;
  status: LegacyWindowReservationStatus;

  constructor(
    code: string,
    label: string,
    notes: string,
    reviewer: string,
    conversionRate: number,
    impressions: number,
    score: number,
    active: boolean,
    threshold: number,
    status: LegacyWindowReservationStatus,
  ) {
    this.code = code;
    this.label = label;
    this.notes = notes;
    this.reviewer = reviewer;
    this.conversionRate = conversionRate;
    this.impressions = impressions;
    this.score = score;
    this.active = active;
    this.threshold = threshold;
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

  canMoveTo(next: LegacyWindowReservationStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "revoked":
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

  moveTo(next: LegacyWindowReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy window reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  netExposure(): number {
    return Math.round((this.conversionRate + this.impressions) * 100) / 100;
  }

  copy(): LegacyWindowReservation {
    return new LegacyWindowReservation(
      this.code,
      this.label,
      this.notes,
      this.reviewer,
      this.conversionRate,
      this.impressions,
      this.score,
      this.active,
      this.threshold,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a legacy window reservation in status requested. */
export function newLegacyWindowReservation(code: string, label: string): LegacyWindowReservation {
  return new LegacyWindowReservation(code, label, "", "", 0, 0, 0, false, 0, "requested");
}
