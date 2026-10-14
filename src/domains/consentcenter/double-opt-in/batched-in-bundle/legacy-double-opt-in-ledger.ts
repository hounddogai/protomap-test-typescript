import * as text from "../../../../kit/text.js";

/** Where a legacy double opt in ledger is in its life cycle. */
export type LegacyDoubleOptInLedgerStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A legacy double opt in ledger. Its code is unique within a tenant. */
export class LegacyDoubleOptInLedger {
  code: string;
  title: string;
  label: string;
  batchSize: number;
  budget: number;
  channel: string;
  updatedAt: number;
  name: string;
  pinned: boolean;
  sendAt: number;
  reviewer: string;
  status: LegacyDoubleOptInLedgerStatus;

  constructor(
    code: string,
    title: string,
    label: string,
    batchSize: number,
    budget: number,
    channel: string,
    updatedAt: number,
    name: string,
    pinned: boolean,
    sendAt: number,
    reviewer: string,
    status: LegacyDoubleOptInLedgerStatus,
  ) {
    this.code = code;
    this.title = title;
    this.label = label;
    this.batchSize = batchSize;
    this.budget = budget;
    this.channel = channel;
    this.updatedAt = updatedAt;
    this.name = name;
    this.pinned = pinned;
    this.sendAt = sendAt;
    this.reviewer = reviewer;
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

  canMoveTo(next: LegacyDoubleOptInLedgerStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "in_review":
        return next === "resolved" || next === "archived";
      case "resolved":
        return next === "archived";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LegacyDoubleOptInLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy double opt in ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.title}`;
  }

  weightedLoad(): number {
    return Math.round(this.budget * this.sendAt * 100) / 100;
  }

  copy(): LegacyDoubleOptInLedger {
    return new LegacyDoubleOptInLedger(
      this.code,
      this.title,
      this.label,
      this.batchSize,
      this.budget,
      this.channel,
      this.updatedAt,
      this.name,
      this.pinned,
      this.sendAt,
      this.reviewer,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a legacy double opt in ledger in status open. */
export function newLegacyDoubleOptInLedger(code: string, title: string): LegacyDoubleOptInLedger {
  return new LegacyDoubleOptInLedger(code, title, "", 0, 0, "", 0, "", false, 0, "", "open");
}
