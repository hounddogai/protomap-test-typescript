/**
 * The placement template records of adops's placement work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a placement template is in its life cycle. */
export type PlacementTemplateStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One placement template, with what the planners need to act on it. */
export class PlacementTemplate {
  code: string;
  title: string;
  score: number;
  phone: string;
  conversionRate: number;
  reviewer: string;
  rate: number;
  ownerId: string;
  attempts: number;
  locale: string;
  cost: number;
  status: PlacementTemplateStatus;

  constructor(
    code: string,
    title: string,
    score: number,
    phone: string,
    conversionRate: number,
    reviewer: string,
    rate: number,
    ownerId: string,
    attempts: number,
    locale: string,
    cost: number,
    status: PlacementTemplateStatus,
  ) {
    this.code = code;
    this.title = title;
    this.score = score;
    this.phone = phone;
    this.conversionRate = conversionRate;
    this.reviewer = reviewer;
    this.rate = rate;
    this.ownerId = ownerId;
    this.attempts = attempts;
    this.locale = locale;
    this.cost = cost;
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

  canMoveTo(next: PlacementTemplateStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "withdrawn";
      case "approved":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: PlacementTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`placement template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"placement template"} ${this.code}`;
  }

  projectedLoad(): number {
    return Math.round((this.cost - this.rate) * 100) / 100;
  }

  copy(): PlacementTemplate {
    return new PlacementTemplate(
      this.code,
      this.title,
      this.score,
      this.phone,
      this.conversionRate,
      this.reviewer,
      this.rate,
      this.ownerId,
      this.attempts,
      this.locale,
      this.cost,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a placement template in status proposed. */
export function newPlacementTemplate(code: string, title: string): PlacementTemplate {
  return new PlacementTemplate(code, title, 0, "", 0, "", 0, "", 0, "", 0, "proposed");
}
