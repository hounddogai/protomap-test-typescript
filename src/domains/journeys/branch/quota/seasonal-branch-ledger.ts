import * as text from "../../../../kit/text.js";

/** Where a seasonal branch ledger is in its life cycle. */
export type SeasonalBranchLedgerStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A seasonal branch ledger. Its code is unique within a tenant. */
export class SeasonalBranchLedger {
  code: string;
  name: string;
  tags: string[];
  clicks: number;
  notes: string;
  category: string;
  utmSource: string;
  margin: number;
  status: SeasonalBranchLedgerStatus;

  constructor(
    code: string,
    name: string,
    tags: string[],
    clicks: number,
    notes: string,
    category: string,
    utmSource: string,
    margin: number,
    status: SeasonalBranchLedgerStatus,
  ) {
    this.code = code;
    this.name = name;
    this.tags = tags;
    this.clicks = clicks;
    this.notes = notes;
    this.category = category;
    this.utmSource = utmSource;
    this.margin = margin;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: SeasonalBranchLedgerStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming" || next === "stopped";
      case "warming":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: SeasonalBranchLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal branch ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"seasonal branch ledger"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  weightedLoad(): number {
    return Math.round((this.margin + this.clicks) * 100) / 100;
  }

  copy(): SeasonalBranchLedger {
    return new SeasonalBranchLedger(
      this.code,
      this.name,
      this.tags,
      this.clicks,
      this.notes,
      this.category,
      this.utmSource,
      this.margin,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a seasonal branch ledger in status idle. */
export function newSeasonalBranchLedger(code: string, name: string): SeasonalBranchLedger {
  return new SeasonalBranchLedger(code, name, [], 0, "", "", "", 0, "idle");
}
