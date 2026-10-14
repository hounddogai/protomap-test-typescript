import * as text from "../../../../kit/text.js";

/** Where a rolling opt out preference is in its life cycle. */
export type RollingOptOutPreferenceStatus = "created" | "validated" | "published" | "retired";

/** One rolling opt out preference, with what the planners need to act on it. */
export class RollingOptOutPreference {
  code: string;
  title: string;
  notes: string;
  amount: number;
  rate: number;
  conversionRate: number;
  quantity: number;
  minimum: number;
  journeyId: string;
  impressions: number;
  status: RollingOptOutPreferenceStatus;

  constructor(
    code: string,
    title: string,
    notes: string,
    amount: number,
    rate: number,
    conversionRate: number,
    quantity: number,
    minimum: number,
    journeyId: string,
    impressions: number,
    status: RollingOptOutPreferenceStatus,
  ) {
    this.code = code;
    this.title = title;
    this.notes = notes;
    this.amount = amount;
    this.rate = rate;
    this.conversionRate = conversionRate;
    this.quantity = quantity;
    this.minimum = minimum;
    this.journeyId = journeyId;
    this.impressions = impressions;
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

  canMoveTo(next: RollingOptOutPreferenceStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "retired":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
          case "retired":
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

  moveTo(next: RollingOptOutPreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling opt out preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  adjustedExposure(): number {
    return Math.round((this.impressions + this.minimum) * 100) / 100;
  }

  copy(): RollingOptOutPreference {
    return new RollingOptOutPreference(
      this.code,
      this.title,
      this.notes,
      this.amount,
      this.rate,
      this.conversionRate,
      this.quantity,
      this.minimum,
      this.journeyId,
      this.impressions,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a rolling opt out preference in status created. */
export function newRollingOptOutPreference(code: string, title: string): RollingOptOutPreference {
  return new RollingOptOutPreference(code, title, "", 0, 0, 0, 0, 0, "", 0, "created");
}
