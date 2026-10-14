import * as text from "../../../../kit/text.js";

/** Where a insight proposal is in its life cycle. */
export type InsightProposalStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a insight proposal and its current status. */
export class InsightProposal {
  code: string;
  title: string;
  locale: string;
  bid: number;
  notes: string;
  status: InsightProposalStatus;

  constructor(
    code: string,
    title: string,
    locale: string,
    bid: number,
    notes: string,
    status: InsightProposalStatus,
  ) {
    this.code = code;
    this.title = title;
    this.locale = locale;
    this.bid = bid;
    this.notes = notes;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: InsightProposalStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
            return true;
        }
        return false;
      case "warming":
        return next === "draining";
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: InsightProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`insight proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"insight proposal"} ${this.code}`;
  }

  measuredValue(): number {
    return this.bid;
  }

  copy(): InsightProposal {
    return new InsightProposal(this.code, this.title, this.locale, this.bid, this.notes, this.status);
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a insight proposal in status idle. */
export function newInsightProposal(code: string, title: string): InsightProposal {
  return new InsightProposal(code, title, "", 0, "", "idle");
}
