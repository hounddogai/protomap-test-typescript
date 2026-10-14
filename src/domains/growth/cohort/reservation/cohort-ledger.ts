import * as text from "../../../../kit/text.js";

/** Where a cohort ledger is in its life cycle. */
export type CohortLedgerStatus = "requested" | "granted" | "revoked" | "expired";

/** A cohort ledger as the cohort team keeps it. */
export class CohortLedger {
  code: string;
  name: string;
  version: number;
  summary: string;
  sequence: number;
  graceDays: number;
  contactEmail: string;
  cost: number;
  attributes: Map<string, string>;
  active: boolean;
  timezone: string;
  status: CohortLedgerStatus;

  constructor(
    code: string,
    name: string,
    version: number,
    summary: string,
    sequence: number,
    graceDays: number,
    contactEmail: string,
    cost: number,
    attributes: Map<string, string>,
    active: boolean,
    timezone: string,
    status: CohortLedgerStatus,
  ) {
    this.code = code;
    this.name = name;
    this.version = version;
    this.summary = summary;
    this.sequence = sequence;
    this.graceDays = graceDays;
    this.contactEmail = contactEmail;
    this.cost = cost;
    this.attributes = attributes;
    this.active = active;
    this.timezone = timezone;
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

  canMoveTo(next: CohortLedgerStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "revoked";
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

  moveTo(next: CohortLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`cohort ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${"cohort ledger"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  projectedExposure(): number {
    return Math.round(this.sequence * this.graceDays * 100) / 100;
  }

  copy(): CohortLedger {
    return new CohortLedger(
      this.code,
      this.name,
      this.version,
      this.summary,
      this.sequence,
      this.graceDays,
      this.contactEmail,
      this.cost,
      this.attributes,
      this.active,
      this.timezone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a cohort ledger in status requested. */
export function newCohortLedger(code: string, name: string): CohortLedger {
  return new CohortLedger(code, name, 0, "", 0, 0, "", 0, new Map<string, string>(), false, "", "requested");
}
