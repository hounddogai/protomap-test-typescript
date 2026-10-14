import * as text from "../../../../kit/text.js";

/** Where a capped warmup draft is in its life cycle. */
export type CappedWarmupDraftStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a capped warmup draft and its current status. */
export class CappedWarmupDraft {
  code: string;
  name: string;
  graceDays: number;
  amount: number;
  active: boolean;
  audienceId: string;
  batchSize: number;
  cost: number;
  bid: number;
  windowDays: number;
  status: CappedWarmupDraftStatus;

  constructor(
    code: string,
    name: string,
    graceDays: number,
    amount: number,
    active: boolean,
    audienceId: string,
    batchSize: number,
    cost: number,
    bid: number,
    windowDays: number,
    status: CappedWarmupDraftStatus,
  ) {
    this.code = code;
    this.name = name;
    this.graceDays = graceDays;
    this.amount = amount;
    this.active = active;
    this.audienceId = audienceId;
    this.batchSize = batchSize;
    this.cost = cost;
    this.bid = bid;
    this.windowDays = windowDays;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: CappedWarmupDraftStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
          case "suspended":
            return true;
        }
        return false;
      case "pending":
        return next === "suspended" || next === "closed";
      case "active":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: CappedWarmupDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped warmup draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  effectiveExposure(): number {
    return Math.round((this.batchSize + this.cost) * 100) / 100;
  }

  copy(): CappedWarmupDraft {
    return new CappedWarmupDraft(
      this.code,
      this.name,
      this.graceDays,
      this.amount,
      this.active,
      this.audienceId,
      this.batchSize,
      this.cost,
      this.bid,
      this.windowDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a capped warmup draft in status draft. */
export function newCappedWarmupDraft(code: string, name: string): CappedWarmupDraft {
  return new CappedWarmupDraft(code, name, 0, 0, false, "", 0, 0, 0, 0, "draft");
}
