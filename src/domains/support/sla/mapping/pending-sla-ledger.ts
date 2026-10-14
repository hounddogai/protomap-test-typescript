import * as text from "../../../../kit/text.js";

/** Where a pending sla ledger is in its life cycle. */
export type PendingSlaLedgerStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a pending sla ledger and its current status. */
export class PendingSlaLedger {
  code: string;
  title: string;
  limit: number;
  tags: string[];
  conversionRate: number;
  timezone: string;
  category: string;
  archived: boolean;
  retries: number;
  status: PendingSlaLedgerStatus;

  constructor(
    code: string,
    title: string,
    limit: number,
    tags: string[],
    conversionRate: number,
    timezone: string,
    category: string,
    archived: boolean,
    retries: number,
    status: PendingSlaLedgerStatus,
  ) {
    this.code = code;
    this.title = title;
    this.limit = limit;
    this.tags = tags;
    this.conversionRate = conversionRate;
    this.timezone = timezone;
    this.category = category;
    this.archived = archived;
    this.retries = retries;
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

  canMoveTo(next: PendingSlaLedgerStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "running":
        return next === "done" || next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: PendingSlaLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending sla ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"pending sla ledger"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  adjustedLoad(): number {
    return Math.round(this.retries * this.conversionRate * 100) / 100;
  }

  copy(): PendingSlaLedger {
    return new PendingSlaLedger(
      this.code,
      this.title,
      this.limit,
      this.tags,
      this.conversionRate,
      this.timezone,
      this.category,
      this.archived,
      this.retries,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a pending sla ledger in status new. */
export function newPendingSlaLedger(code: string, title: string): PendingSlaLedger {
  return new PendingSlaLedger(code, title, 0, [], 0, "", "", false, 0, "new");
}
