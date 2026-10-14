/**
 * The weighted journey agreement records of journeys's journey work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a weighted journey agreement is in its life cycle. */
export type WeightedJourneyAgreementStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A weighted journey agreement. Its code is unique within a tenant. */
export class WeightedJourneyAgreement {
  code: string;
  title: string;
  durationMinutes: number;
  discount: number;
  segment: string;
  approved: boolean;
  pinned: boolean;
  attempts: number;
  frequencyCap: number;
  cohort: string;
  status: WeightedJourneyAgreementStatus;

  constructor(
    code: string,
    title: string,
    durationMinutes: number,
    discount: number,
    segment: string,
    approved: boolean,
    pinned: boolean,
    attempts: number,
    frequencyCap: number,
    cohort: string,
    status: WeightedJourneyAgreementStatus,
  ) {
    this.code = code;
    this.title = title;
    this.durationMinutes = durationMinutes;
    this.discount = discount;
    this.segment = segment;
    this.approved = approved;
    this.pinned = pinned;
    this.attempts = attempts;
    this.frequencyCap = frequencyCap;
    this.cohort = cohort;
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

  canMoveTo(next: WeightedJourneyAgreementStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "ready" || next === "draining";
      case "warming":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        return next === "draining";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: WeightedJourneyAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted journey agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  adjustedTotal(): number {
    return Math.round(this.frequencyCap * this.discount * 100) / 100;
  }

  copy(): WeightedJourneyAgreement {
    return new WeightedJourneyAgreement(
      this.code,
      this.title,
      this.durationMinutes,
      this.discount,
      this.segment,
      this.approved,
      this.pinned,
      this.attempts,
      this.frequencyCap,
      this.cohort,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a weighted journey agreement in status idle. */
export function newWeightedJourneyAgreement(code: string, title: string): WeightedJourneyAgreement {
  return new WeightedJourneyAgreement(code, title, 0, 0, "", false, false, 0, 0, "", "idle");
}
