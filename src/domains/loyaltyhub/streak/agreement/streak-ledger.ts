import * as text from "../../../../kit/text.js";

/** Where a streak ledger is in its life cycle. */
export type StreakLedgerStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A streak ledger. Its code is unique within a tenant. */
export class StreakLedger {
  code: string;
  title: string;
  cohort: string;
  utmSource: string;
  weight: number;
  reviewer: string;
  attributes: Map<string, string>;
  endsAt: number;
  summary: string;
  status: StreakLedgerStatus;

  constructor(
    code: string,
    title: string,
    cohort: string,
    utmSource: string,
    weight: number,
    reviewer: string,
    attributes: Map<string, string>,
    endsAt: number,
    summary: string,
    status: StreakLedgerStatus,
  ) {
    this.code = code;
    this.title = title;
    this.cohort = cohort;
    this.utmSource = utmSource;
    this.weight = weight;
    this.reviewer = reviewer;
    this.attributes = attributes;
    this.endsAt = endsAt;
    this.summary = summary;
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

  canMoveTo(next: StreakLedgerStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected";
      case "approved":
        return next === "rejected";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: StreakLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`streak ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
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

  effectiveLoad(): number {
    return Math.round(this.weight * this.endsAt * 100) / 100;
  }

  copy(): StreakLedger {
    return new StreakLedger(
      this.code,
      this.title,
      this.cohort,
      this.utmSource,
      this.weight,
      this.reviewer,
      this.attributes,
      this.endsAt,
      this.summary,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a streak ledger in status proposed. */
export function newStreakLedger(code: string, title: string): StreakLedger {
  return new StreakLedger(code, title, "", "", 0, "", new Map<string, string>(), 0, "", "proposed");
}
