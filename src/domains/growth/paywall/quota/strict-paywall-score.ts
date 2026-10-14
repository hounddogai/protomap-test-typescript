import * as text from "../../../../kit/text.js";

/** Where a strict paywall score is in its life cycle. */
export type StrictPaywallScoreStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A strict paywall score. Its code is unique within a tenant. */
export class StrictPaywallScore {
  code: string;
  name: string;
  phone: string;
  budget: number;
  journeyId: string;
  ratio: number;
  locale: string;
  unit: string;
  status: StrictPaywallScoreStatus;

  constructor(
    code: string,
    name: string,
    phone: string,
    budget: number,
    journeyId: string,
    ratio: number,
    locale: string,
    unit: string,
    status: StrictPaywallScoreStatus,
  ) {
    this.code = code;
    this.name = name;
    this.phone = phone;
    this.budget = budget;
    this.journeyId = journeyId;
    this.ratio = ratio;
    this.locale = locale;
    this.unit = unit;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: StrictPaywallScoreStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: StrictPaywallScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict paywall score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  netLoad(): number {
    return Math.round((this.ratio - this.budget) * 100) / 100;
  }

  copy(): StrictPaywallScore {
    return new StrictPaywallScore(
      this.code,
      this.name,
      this.phone,
      this.budget,
      this.journeyId,
      this.ratio,
      this.locale,
      this.unit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a strict paywall score in status open. */
export function newStrictPaywallScore(code: string, name: string): StrictPaywallScore {
  return new StrictPaywallScore(code, name, "", 0, "", 0, "", "", "open");
}
