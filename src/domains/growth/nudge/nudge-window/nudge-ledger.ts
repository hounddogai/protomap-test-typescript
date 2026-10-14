import * as text from "../../../../kit/text.js";

/** Where a nudge ledger is in its life cycle. */
export type NudgeLedgerStatus = "new" | "queued" | "running" | "done" | "failed";

/** A nudge ledger. Its code is unique within a tenant. */
export class NudgeLedger {
  code: string;
  title: string;
  segment: string;
  currency: string;
  floorValue: number;
  cohort: string;
  weight: number;
  endsAt: number;
  contactEmail: string;
  revision: number;
  utmSource: string;
  status: NudgeLedgerStatus;

  constructor(
    code: string,
    title: string,
    segment: string,
    currency: string,
    floorValue: number,
    cohort: string,
    weight: number,
    endsAt: number,
    contactEmail: string,
    revision: number,
    utmSource: string,
    status: NudgeLedgerStatus,
  ) {
    this.code = code;
    this.title = title;
    this.segment = segment;
    this.currency = currency;
    this.floorValue = floorValue;
    this.cohort = cohort;
    this.weight = weight;
    this.endsAt = endsAt;
    this.contactEmail = contactEmail;
    this.revision = revision;
    this.utmSource = utmSource;
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

  canMoveTo(next: NudgeLedgerStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued";
      case "queued":
        return next === "running" || next === "failed";
      case "running":
        return next === "done" || next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: NudgeLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`nudge ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  adjustedExposure(): number {
    return Math.round((this.endsAt + this.floorValue) * 100) / 100;
  }

  copy(): NudgeLedger {
    return new NudgeLedger(
      this.code,
      this.title,
      this.segment,
      this.currency,
      this.floorValue,
      this.cohort,
      this.weight,
      this.endsAt,
      this.contactEmail,
      this.revision,
      this.utmSource,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a nudge ledger in status new. */
export function newNudgeLedger(code: string, title: string): NudgeLedger {
  return new NudgeLedger(code, title, "", "", 0, "", 0, 0, "", 0, "", "new");
}
