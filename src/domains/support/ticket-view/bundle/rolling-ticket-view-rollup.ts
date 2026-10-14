import * as text from "../../../../kit/text.js";

/** Where a rolling ticket view rollup is in its life cycle. */
export type RollingTicketViewRollupStatus = "new" | "queued" | "running" | "done" | "failed";

/** One rolling ticket view rollup, with what the planners need to act on it. */
export class RollingTicketViewRollup {
  code: string;
  name: string;
  createdAt: number;
  budget: number;
  pinned: boolean;
  batchSize: number;
  status: RollingTicketViewRollupStatus;

  constructor(
    code: string,
    name: string,
    createdAt: number,
    budget: number,
    pinned: boolean,
    batchSize: number,
    status: RollingTicketViewRollupStatus,
  ) {
    this.code = code;
    this.name = name;
    this.createdAt = createdAt;
    this.budget = budget;
    this.pinned = pinned;
    this.batchSize = batchSize;
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

  canMoveTo(next: RollingTicketViewRollupStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "failed";
      case "queued":
        return next === "running" || next === "done";
      case "running":
        return next === "done";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: RollingTicketViewRollupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling ticket view rollup ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"rolling ticket view rollup"} ${this.code}`;
  }

  weightedVolume(): number {
    return Math.round((this.createdAt - this.batchSize) * 100) / 100;
  }

  copy(): RollingTicketViewRollup {
    return new RollingTicketViewRollup(
      this.code,
      this.name,
      this.createdAt,
      this.budget,
      this.pinned,
      this.batchSize,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a rolling ticket view rollup in status new. */
export function newRollingTicketViewRollup(code: string, name: string): RollingTicketViewRollup {
  return new RollingTicketViewRollup(code, name, 0, 0, false, 0, "new");
}
