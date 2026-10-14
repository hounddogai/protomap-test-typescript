import * as text from "../../../../kit/text.js";

/** Where a adaptive reward rule ledger is in its life cycle. */
export type AdaptiveRewardRuleLedgerStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a adaptive reward rule ledger and its current status. */
export class AdaptiveRewardRuleLedger {
  code: string;
  label: string;
  timezone: string;
  name: string;
  clicks: number;
  revision: number;
  active: boolean;
  score: number;
  description: string;
  status: AdaptiveRewardRuleLedgerStatus;

  constructor(
    code: string,
    label: string,
    timezone: string,
    name: string,
    clicks: number,
    revision: number,
    active: boolean,
    score: number,
    description: string,
    status: AdaptiveRewardRuleLedgerStatus,
  ) {
    this.code = code;
    this.label = label;
    this.timezone = timezone;
    this.name = name;
    this.clicks = clicks;
    this.revision = revision;
    this.active = active;
    this.score = score;
    this.description = description;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: AdaptiveRewardRuleLedgerStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued" || next === "done";
      case "queued":
        switch (next) {
          case "running":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: AdaptiveRewardRuleLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive reward rule ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  displayLabel(): string {
    return `${"adaptive reward rule ledger"} ${this.code}`;
  }

  adjustedExposure(): number {
    return Math.round((this.revision - this.score) * 100) / 100;
  }

  copy(): AdaptiveRewardRuleLedger {
    return new AdaptiveRewardRuleLedger(
      this.code,
      this.label,
      this.timezone,
      this.name,
      this.clicks,
      this.revision,
      this.active,
      this.score,
      this.description,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a adaptive reward rule ledger in status new. */
export function newAdaptiveRewardRuleLedger(code: string, label: string): AdaptiveRewardRuleLedger {
  return new AdaptiveRewardRuleLedger(code, label, "", "", 0, 0, false, 0, "", "new");
}
