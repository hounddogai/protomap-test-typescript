import * as text from "../../../../kit/text.js";

/** Where a global reward rule slot is in its life cycle. */
export type GlobalRewardRuleSlotStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One global reward rule slot, with what the planners need to act on it. */
export class GlobalRewardRuleSlot {
  code: string;
  name: string;
  attributes: Map<string, string>;
  minimum: number;
  contactEmail: string;
  journeyId: string;
  cohort: string;
  score: number;
  conversionRate: number;
  expiresAt: number;
  category: string;
  status: GlobalRewardRuleSlotStatus;

  constructor(
    code: string,
    name: string,
    attributes: Map<string, string>,
    minimum: number,
    contactEmail: string,
    journeyId: string,
    cohort: string,
    score: number,
    conversionRate: number,
    expiresAt: number,
    category: string,
    status: GlobalRewardRuleSlotStatus,
  ) {
    this.code = code;
    this.name = name;
    this.attributes = attributes;
    this.minimum = minimum;
    this.contactEmail = contactEmail;
    this.journeyId = journeyId;
    this.cohort = cohort;
    this.score = score;
    this.conversionRate = conversionRate;
    this.expiresAt = expiresAt;
    this.category = category;
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

  canMoveTo(next: GlobalRewardRuleSlotStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "in_review":
        return next === "resolved";
      case "resolved":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: GlobalRewardRuleSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global reward rule slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"global reward rule slot"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  netExposure(): number {
    return Math.round((this.conversionRate + this.minimum) * 100) / 100;
  }

  copy(): GlobalRewardRuleSlot {
    return new GlobalRewardRuleSlot(
      this.code,
      this.name,
      this.attributes,
      this.minimum,
      this.contactEmail,
      this.journeyId,
      this.cohort,
      this.score,
      this.conversionRate,
      this.expiresAt,
      this.category,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a global reward rule slot in status open. */
export function newGlobalRewardRuleSlot(code: string, name: string): GlobalRewardRuleSlot {
  return new GlobalRewardRuleSlot(code, name, new Map<string, string>(), 0, "", "", "", 0, 0, 0, "", "open");
}
