import * as text from "../../../../kit/text.js";

/** Where a seasonal reputation ledger is in its life cycle. */
export type SeasonalReputationLedgerStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A seasonal reputation ledger. Its code is unique within a tenant. */
export class SeasonalReputationLedger {
  code: string;
  label: string;
  audienceId: string;
  margin: number;
  cost: number;
  graceDays: number;
  title: string;
  region: string;
  retries: number;
  status: SeasonalReputationLedgerStatus;

  constructor(
    code: string,
    label: string,
    audienceId: string,
    margin: number,
    cost: number,
    graceDays: number,
    title: string,
    region: string,
    retries: number,
    status: SeasonalReputationLedgerStatus,
  ) {
    this.code = code;
    this.label = label;
    this.audienceId = audienceId;
    this.margin = margin;
    this.cost = cost;
    this.graceDays = graceDays;
    this.title = title;
    this.region = region;
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

  canMoveTo(next: SeasonalReputationLedgerStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "reopened";
      case "in_review":
        return next === "resolved";
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SeasonalReputationLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal reputation ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  projectedValue(): number {
    return Math.round((this.cost - this.margin) * 100) / 100;
  }

  copy(): SeasonalReputationLedger {
    return new SeasonalReputationLedger(
      this.code,
      this.label,
      this.audienceId,
      this.margin,
      this.cost,
      this.graceDays,
      this.title,
      this.region,
      this.retries,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a seasonal reputation ledger in status open. */
export function newSeasonalReputationLedger(code: string, label: string): SeasonalReputationLedger {
  return new SeasonalReputationLedger(code, label, "", 0, 0, 0, "", "", 0, "open");
}
