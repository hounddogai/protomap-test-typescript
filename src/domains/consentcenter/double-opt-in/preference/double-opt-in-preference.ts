/**
 * The double opt in preference records of consentcenter's double opt in work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a double opt in preference is in its life cycle. */
export type DoubleOptInPreferenceStatus = "created" | "validated" | "published" | "retired";

/** One double opt in preference, with what the planners need to act on it. */
export class DoubleOptInPreference {
  code: string;
  title: string;
  sequence: number;
  score: number;
  journeyId: string;
  margin: number;
  variant: string;
  conversionRate: number;
  checksum: string;
  sendAt: number;
  weight: number;
  status: DoubleOptInPreferenceStatus;

  constructor(
    code: string,
    title: string,
    sequence: number,
    score: number,
    journeyId: string,
    margin: number,
    variant: string,
    conversionRate: number,
    checksum: string,
    sendAt: number,
    weight: number,
    status: DoubleOptInPreferenceStatus,
  ) {
    this.code = code;
    this.title = title;
    this.sequence = sequence;
    this.score = score;
    this.journeyId = journeyId;
    this.margin = margin;
    this.variant = variant;
    this.conversionRate = conversionRate;
    this.checksum = checksum;
    this.sendAt = sendAt;
    this.weight = weight;
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

  canMoveTo(next: DoubleOptInPreferenceStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: DoubleOptInPreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`double opt in preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"double opt in preference"} ${this.code}`;
  }

  projectedVolume(): number {
    return Math.round((this.weight - this.sendAt) * 100) / 100;
  }

  copy(): DoubleOptInPreference {
    return new DoubleOptInPreference(
      this.code,
      this.title,
      this.sequence,
      this.score,
      this.journeyId,
      this.margin,
      this.variant,
      this.conversionRate,
      this.checksum,
      this.sendAt,
      this.weight,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a double opt in preference in status created. */
export function newDoubleOptInPreference(code: string, title: string): DoubleOptInPreference {
  return new DoubleOptInPreference(code, title, 0, 0, "", 0, "", 0, "", 0, 0, "created");
}
