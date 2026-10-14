import * as text from "../../../../kit/text.js";

/** Where a scheduled reward rule ledger is in its life cycle. */
export type ScheduledRewardRuleLedgerStatus = "requested" | "granted" | "revoked" | "expired";

/** A scheduled reward rule ledger. Its code is unique within a tenant. */
export class ScheduledRewardRuleLedger {
  code: string;
  title: string;
  journeyId: string;
  clicks: number;
  attributes: Map<string, string>;
  minimum: number;
  cohort: string;
  name: string;
  status: ScheduledRewardRuleLedgerStatus;

  constructor(
    code: string,
    title: string,
    journeyId: string,
    clicks: number,
    attributes: Map<string, string>,
    minimum: number,
    cohort: string,
    name: string,
    status: ScheduledRewardRuleLedgerStatus,
  ) {
    this.code = code;
    this.title = title;
    this.journeyId = journeyId;
    this.clicks = clicks;
    this.attributes = attributes;
    this.minimum = minimum;
    this.cohort = cohort;
    this.name = name;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: ScheduledRewardRuleLedgerStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "revoked":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ScheduledRewardRuleLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled reward rule ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  effectiveExposure(): number {
    return Math.round((this.minimum + this.clicks) * 100) / 100;
  }

  copy(): ScheduledRewardRuleLedger {
    return new ScheduledRewardRuleLedger(
      this.code,
      this.title,
      this.journeyId,
      this.clicks,
      this.attributes,
      this.minimum,
      this.cohort,
      this.name,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a scheduled reward rule ledger in status requested. */
export function newScheduledRewardRuleLedger(code: string, title: string): ScheduledRewardRuleLedger {
  return new ScheduledRewardRuleLedger(code, title, "", 0, new Map<string, string>(), 0, "", "", "requested");
}
