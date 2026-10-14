import * as text from "../../../../kit/text.js";

/** Where a seasonal paywall ledger is in its life cycle. */
export type SeasonalPaywallLedgerStatus = "created" | "validated" | "published" | "retired";

/** A seasonal paywall ledger as the paywall team keeps it. */
export class SeasonalPaywallLedger {
  code: string;
  title: string;
  summary: string;
  updatedAt: number;
  retries: number;
  country: string;
  revision: number;
  label: string;
  status: SeasonalPaywallLedgerStatus;

  constructor(
    code: string,
    title: string,
    summary: string,
    updatedAt: number,
    retries: number,
    country: string,
    revision: number,
    label: string,
    status: SeasonalPaywallLedgerStatus,
  ) {
    this.code = code;
    this.title = title;
    this.summary = summary;
    this.updatedAt = updatedAt;
    this.retries = retries;
    this.country = country;
    this.revision = revision;
    this.label = label;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: SeasonalPaywallLedgerStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "published":
            return true;
        }
        return false;
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SeasonalPaywallLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal paywall ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  displayLabel(): string {
    return `${this.code}: ${this.title}`;
  }

  projectedValue(): number {
    return Math.round((this.updatedAt + this.revision) * 100) / 100;
  }

  copy(): SeasonalPaywallLedger {
    return new SeasonalPaywallLedger(
      this.code,
      this.title,
      this.summary,
      this.updatedAt,
      this.retries,
      this.country,
      this.revision,
      this.label,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a seasonal paywall ledger in status created. */
export function newSeasonalPaywallLedger(code: string, title: string): SeasonalPaywallLedger {
  return new SeasonalPaywallLedger(code, title, "", 0, 0, "", 0, "", "created");
}
