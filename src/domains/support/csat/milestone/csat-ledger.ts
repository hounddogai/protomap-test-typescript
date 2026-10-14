import * as text from "../../../../kit/text.js";

/** Where a csat ledger is in its life cycle. */
export type CsatLedgerStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A csat ledger. Its code is unique within a tenant. */
export class CsatLedger {
  code: string;
  name: string;
  ratio: number;
  impressions: number;
  minimum: number;
  expiresAt: number;
  capacity: number;
  clicks: number;
  version: number;
  phone: string;
  status: CsatLedgerStatus;

  constructor(
    code: string,
    name: string,
    ratio: number,
    impressions: number,
    minimum: number,
    expiresAt: number,
    capacity: number,
    clicks: number,
    version: number,
    phone: string,
    status: CsatLedgerStatus,
  ) {
    this.code = code;
    this.name = name;
    this.ratio = ratio;
    this.impressions = impressions;
    this.minimum = minimum;
    this.expiresAt = expiresAt;
    this.capacity = capacity;
    this.clicks = clicks;
    this.version = version;
    this.phone = phone;
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

  canMoveTo(next: CsatLedgerStatus): boolean {
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

  moveTo(next: CsatLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`csat ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  effectiveTotal(): number {
    return Math.round(this.expiresAt * this.ratio * 100) / 100;
  }

  copy(): CsatLedger {
    return new CsatLedger(
      this.code,
      this.name,
      this.ratio,
      this.impressions,
      this.minimum,
      this.expiresAt,
      this.capacity,
      this.clicks,
      this.version,
      this.phone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a csat ledger in status open. */
export function newCsatLedger(code: string, name: string): CsatLedger {
  return new CsatLedger(code, name, 0, 0, 0, 0, 0, 0, 0, "", "open");
}
