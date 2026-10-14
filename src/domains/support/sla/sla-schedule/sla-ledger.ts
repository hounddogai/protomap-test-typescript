import * as text from "../../../../kit/text.js";

/** Where a sla ledger is in its life cycle. */
export type SlaLedgerStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A sla ledger. Its code is unique within a tenant. */
export class SlaLedger {
  code: string;
  name: string;
  label: string;
  score: number;
  summary: string;
  channel: string;
  bid: number;
  retries: number;
  active: boolean;
  budget: number;
  utmSource: string;
  status: SlaLedgerStatus;

  constructor(
    code: string,
    name: string,
    label: string,
    score: number,
    summary: string,
    channel: string,
    bid: number,
    retries: number,
    active: boolean,
    budget: number,
    utmSource: string,
    status: SlaLedgerStatus,
  ) {
    this.code = code;
    this.name = name;
    this.label = label;
    this.score = score;
    this.summary = summary;
    this.channel = channel;
    this.bid = bid;
    this.retries = retries;
    this.active = active;
    this.budget = budget;
    this.utmSource = utmSource;
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

  canMoveTo(next: SlaLedgerStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected" || next === "withdrawn";
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SlaLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`sla ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.name}]`;
  }

  weightedValue(): number {
    return Math.round((this.bid - this.score) * 100) / 100;
  }

  copy(): SlaLedger {
    return new SlaLedger(
      this.code,
      this.name,
      this.label,
      this.score,
      this.summary,
      this.channel,
      this.bid,
      this.retries,
      this.active,
      this.budget,
      this.utmSource,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a sla ledger in status proposed. */
export function newSlaLedger(code: string, name: string): SlaLedger {
  return new SlaLedger(code, name, "", 0, "", "", 0, 0, false, 0, "", "proposed");
}
