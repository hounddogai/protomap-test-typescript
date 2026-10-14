import * as text from "../../../../kit/text.js";

/** Where a reward rule reservation is in its life cycle. */
export type RewardRuleReservationStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A reward rule reservation as the reward rule team keeps it. */
export class RewardRuleReservation {
  code: string;
  label: string;
  amount: number;
  locale: string;
  country: string;
  ceiling: number;
  status: RewardRuleReservationStatus;

  constructor(
    code: string,
    label: string,
    amount: number,
    locale: string,
    country: string,
    ceiling: number,
    status: RewardRuleReservationStatus,
  ) {
    this.code = code;
    this.label = label;
    this.amount = amount;
    this.locale = locale;
    this.country = country;
    this.ceiling = ceiling;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: RewardRuleReservationStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "active":
          case "closed":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "active":
          case "closed":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: RewardRuleReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reward rule reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  weightedValue(): number {
    return Math.round((this.ceiling + this.amount) * 100) / 100;
  }

  copy(): RewardRuleReservation {
    return new RewardRuleReservation(
      this.code,
      this.label,
      this.amount,
      this.locale,
      this.country,
      this.ceiling,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a reward rule reservation in status draft. */
export function newRewardRuleReservation(code: string, label: string): RewardRuleReservation {
  return new RewardRuleReservation(code, label, 0, "", "", 0, "draft");
}
