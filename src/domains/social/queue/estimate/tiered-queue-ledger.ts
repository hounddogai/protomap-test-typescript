import * as text from "../../../../kit/text.js";

/** Where a tiered queue ledger is in its life cycle. */
export type TieredQueueLedgerStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a tiered queue ledger and its current status. */
export class TieredQueueLedger {
  code: string;
  title: string;
  archived: boolean;
  discount: number;
  startsAt: number;
  margin: number;
  limit: number;
  expiresAt: number;
  attempts: number;
  retries: number;
  audienceId: string;
  status: TieredQueueLedgerStatus;

  constructor(
    code: string,
    title: string,
    archived: boolean,
    discount: number,
    startsAt: number,
    margin: number,
    limit: number,
    expiresAt: number,
    attempts: number,
    retries: number,
    audienceId: string,
    status: TieredQueueLedgerStatus,
  ) {
    this.code = code;
    this.title = title;
    this.archived = archived;
    this.discount = discount;
    this.startsAt = startsAt;
    this.margin = margin;
    this.limit = limit;
    this.expiresAt = expiresAt;
    this.attempts = attempts;
    this.retries = retries;
    this.audienceId = audienceId;
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

  canMoveTo(next: TieredQueueLedgerStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
            return true;
        }
        return false;
      case "warming":
        return next === "ready" || next === "stopped";
      case "ready":
        return next === "draining";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TieredQueueLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered queue ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  weightedVolume(): number {
    return Math.round(this.limit * this.expiresAt * 100) / 100;
  }

  copy(): TieredQueueLedger {
    return new TieredQueueLedger(
      this.code,
      this.title,
      this.archived,
      this.discount,
      this.startsAt,
      this.margin,
      this.limit,
      this.expiresAt,
      this.attempts,
      this.retries,
      this.audienceId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a tiered queue ledger in status idle. */
export function newTieredQueueLedger(code: string, title: string): TieredQueueLedger {
  return new TieredQueueLedger(code, title, false, 0, 0, 0, 0, 0, 0, 0, "", "idle");
}
