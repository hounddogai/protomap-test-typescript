import * as text from "../../../../kit/text.js";

/** Where a bid rule template is in its life cycle. */
export type BidRuleTemplateStatus = "created" | "validated" | "published" | "retired";

/** A bid rule template as the bid rule team keeps it. */
export class BidRuleTemplate {
  code: string;
  name: string;
  locale: string;
  score: number;
  ceiling: number;
  frequencyCap: number;
  graceDays: number;
  status: BidRuleTemplateStatus;

  constructor(
    code: string,
    name: string,
    locale: string,
    score: number,
    ceiling: number,
    frequencyCap: number,
    graceDays: number,
    status: BidRuleTemplateStatus,
  ) {
    this.code = code;
    this.name = name;
    this.locale = locale;
    this.score = score;
    this.ceiling = ceiling;
    this.frequencyCap = frequencyCap;
    this.graceDays = graceDays;
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

  canMoveTo(next: BidRuleTemplateStatus): boolean {
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
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: BidRuleTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`bid rule template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  weightedVolume(): number {
    return Math.round(this.score * this.graceDays * 100) / 100;
  }

  copy(): BidRuleTemplate {
    return new BidRuleTemplate(
      this.code,
      this.name,
      this.locale,
      this.score,
      this.ceiling,
      this.frequencyCap,
      this.graceDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a bid rule template in status created. */
export function newBidRuleTemplate(code: string, name: string): BidRuleTemplate {
  return new BidRuleTemplate(code, name, "", 0, 0, 0, 0, "created");
}
