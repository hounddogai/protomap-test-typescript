import * as text from "../../../../kit/text.js";

/** Where a strict queue ledger is in its life cycle. */
export type StrictQueueLedgerStatus = "new" | "queued" | "running" | "done" | "failed";

/** A strict queue ledger as the queue team keeps it. */
export class StrictQueueLedger {
  code: string;
  name: string;
  clicks: number;
  channel: string;
  unit: string;
  windowDays: number;
  quantity: number;
  status: StrictQueueLedgerStatus;

  constructor(
    code: string,
    name: string,
    clicks: number,
    channel: string,
    unit: string,
    windowDays: number,
    quantity: number,
    status: StrictQueueLedgerStatus,
  ) {
    this.code = code;
    this.name = name;
    this.clicks = clicks;
    this.channel = channel;
    this.unit = unit;
    this.windowDays = windowDays;
    this.quantity = quantity;
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

  canMoveTo(next: StrictQueueLedgerStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued" || next === "failed";
      case "queued":
        switch (next) {
          case "running":
          case "done":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: StrictQueueLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict queue ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  effectiveLoad(): number {
    return Math.round((this.quantity + this.clicks) * 100) / 100;
  }

  copy(): StrictQueueLedger {
    return new StrictQueueLedger(
      this.code,
      this.name,
      this.clicks,
      this.channel,
      this.unit,
      this.windowDays,
      this.quantity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a strict queue ledger in status new. */
export function newStrictQueueLedger(code: string, name: string): StrictQueueLedger {
  return new StrictQueueLedger(code, name, 0, "", "", 0, 0, "new");
}
