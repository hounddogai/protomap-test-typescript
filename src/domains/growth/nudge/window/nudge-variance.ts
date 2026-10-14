import * as text from "../../../../kit/text.js";

/** Where a nudge variance is in its life cycle. */
export type NudgeVarianceStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A nudge variance. Its code is unique within a tenant. */
export class NudgeVariance {
  code: string;
  name: string;
  attempts: number;
  budget: number;
  clicks: number;
  locale: string;
  ownerId: string;
  ceiling: number;
  conversionRate: number;
  amount: number;
  contactEmail: string;
  status: NudgeVarianceStatus;

  constructor(
    code: string,
    name: string,
    attempts: number,
    budget: number,
    clicks: number,
    locale: string,
    ownerId: string,
    ceiling: number,
    conversionRate: number,
    amount: number,
    contactEmail: string,
    status: NudgeVarianceStatus,
  ) {
    this.code = code;
    this.name = name;
    this.attempts = attempts;
    this.budget = budget;
    this.clicks = clicks;
    this.locale = locale;
    this.ownerId = ownerId;
    this.ceiling = ceiling;
    this.conversionRate = conversionRate;
    this.amount = amount;
    this.contactEmail = contactEmail;
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

  canMoveTo(next: NudgeVarianceStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: NudgeVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`nudge variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  weightedVolume(): number {
    return Math.round((this.clicks + this.attempts) * 100) / 100;
  }

  copy(): NudgeVariance {
    return new NudgeVariance(
      this.code,
      this.name,
      this.attempts,
      this.budget,
      this.clicks,
      this.locale,
      this.ownerId,
      this.ceiling,
      this.conversionRate,
      this.amount,
      this.contactEmail,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a nudge variance in status planned. */
export function newNudgeVariance(code: string, name: string): NudgeVariance {
  return new NudgeVariance(code, name, 0, 0, 0, "", "", 0, 0, 0, "", "planned");
}
