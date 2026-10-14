/**
 * The reputation variance records of deliverability's reputation work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a reputation variance is in its life cycle. */
export type ReputationVarianceStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a reputation variance and its current status. */
export class ReputationVariance {
  code: string;
  name: string;
  audienceId: string;
  description: string;
  locale: string;
  quantity: number;
  attempts: number;
  unit: string;
  status: ReputationVarianceStatus;

  constructor(
    code: string,
    name: string,
    audienceId: string,
    description: string,
    locale: string,
    quantity: number,
    attempts: number,
    unit: string,
    status: ReputationVarianceStatus,
  ) {
    this.code = code;
    this.name = name;
    this.audienceId = audienceId;
    this.description = description;
    this.locale = locale;
    this.quantity = quantity;
    this.attempts = attempts;
    this.unit = unit;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: ReputationVarianceStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved";
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: ReputationVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reputation variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  adjustedVolume(): number {
    return Math.round((this.quantity + this.attempts) * 100) / 100;
  }

  copy(): ReputationVariance {
    return new ReputationVariance(
      this.code,
      this.name,
      this.audienceId,
      this.description,
      this.locale,
      this.quantity,
      this.attempts,
      this.unit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a reputation variance in status proposed. */
export function newReputationVariance(code: string, name: string): ReputationVariance {
  return new ReputationVariance(code, name, "", "", "", 0, 0, "", "proposed");
}
