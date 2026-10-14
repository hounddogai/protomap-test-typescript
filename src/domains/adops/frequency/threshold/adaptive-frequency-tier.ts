import * as text from "../../../../kit/text.js";

/** Where a adaptive frequency tier is in its life cycle. */
export type AdaptiveFrequencyTierStatus = "created" | "validated" | "published" | "retired";

/** The record of a adaptive frequency tier and its current status. */
export class AdaptiveFrequencyTier {
  code: string;
  title: string;
  cost: number;
  active: boolean;
  cohort: string;
  durationMinutes: number;
  journeyId: string;
  status: AdaptiveFrequencyTierStatus;

  constructor(
    code: string,
    title: string,
    cost: number,
    active: boolean,
    cohort: string,
    durationMinutes: number,
    journeyId: string,
    status: AdaptiveFrequencyTierStatus,
  ) {
    this.code = code;
    this.title = title;
    this.cost = cost;
    this.active = active;
    this.cohort = cohort;
    this.durationMinutes = durationMinutes;
    this.journeyId = journeyId;
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

  canMoveTo(next: AdaptiveFrequencyTierStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "validated":
        return next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: AdaptiveFrequencyTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive frequency tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"adaptive frequency tier"} ${this.code}`;
  }

  weightedLoad(): number {
    return Math.round((this.durationMinutes + this.cost) * 100) / 100;
  }

  copy(): AdaptiveFrequencyTier {
    return new AdaptiveFrequencyTier(
      this.code,
      this.title,
      this.cost,
      this.active,
      this.cohort,
      this.durationMinutes,
      this.journeyId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a adaptive frequency tier in status created. */
export function newAdaptiveFrequencyTier(code: string, title: string): AdaptiveFrequencyTier {
  return new AdaptiveFrequencyTier(code, title, 0, false, "", 0, "", "created");
}
