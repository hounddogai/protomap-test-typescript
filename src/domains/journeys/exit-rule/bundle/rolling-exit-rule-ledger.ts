import * as text from "../../../../kit/text.js";

/** Where a rolling exit rule ledger is in its life cycle. */
export type RollingExitRuleLedgerStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A rolling exit rule ledger. Its code is unique within a tenant. */
export class RollingExitRuleLedger {
  code: string;
  name: string;
  margin: number;
  budget: number;
  locale: string;
  score: number;
  description: string;
  reviewer: string;
  channel: string;
  cohort: string;
  retries: number;
  status: RollingExitRuleLedgerStatus;

  constructor(
    code: string,
    name: string,
    margin: number,
    budget: number,
    locale: string,
    score: number,
    description: string,
    reviewer: string,
    channel: string,
    cohort: string,
    retries: number,
    status: RollingExitRuleLedgerStatus,
  ) {
    this.code = code;
    this.name = name;
    this.margin = margin;
    this.budget = budget;
    this.locale = locale;
    this.score = score;
    this.description = description;
    this.reviewer = reviewer;
    this.channel = channel;
    this.cohort = cohort;
    this.retries = retries;
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

  canMoveTo(next: RollingExitRuleLedgerStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "in_review":
        return next === "reopened" || next === "archived";
      case "resolved":
        return next === "reopened";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: RollingExitRuleLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling exit rule ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  weightedLoad(): number {
    return Math.round((this.margin - this.score) * 100) / 100;
  }

  copy(): RollingExitRuleLedger {
    return new RollingExitRuleLedger(
      this.code,
      this.name,
      this.margin,
      this.budget,
      this.locale,
      this.score,
      this.description,
      this.reviewer,
      this.channel,
      this.cohort,
      this.retries,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a rolling exit rule ledger in status open. */
export function newRollingExitRuleLedger(code: string, name: string): RollingExitRuleLedger {
  return new RollingExitRuleLedger(code, name, 0, 0, "", 0, "", "", "", "", 0, "open");
}
