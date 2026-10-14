import * as text from "../../../../kit/text.js";

/** Where a tiered ticket view adjustment is in its life cycle. */
export type TieredTicketViewAdjustmentStatus = "new" | "queued" | "running" | "done" | "failed";

/** A tiered ticket view adjustment as the ticket view team keeps it. */
export class TieredTicketViewAdjustment {
  code: string;
  title: string;
  label: string;
  region: string;
  batchSize: number;
  status: TieredTicketViewAdjustmentStatus;

  constructor(
    code: string,
    title: string,
    label: string,
    region: string,
    batchSize: number,
    status: TieredTicketViewAdjustmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.label = label;
    this.region = region;
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

  canMoveTo(next: TieredTicketViewAdjustmentStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "queued":
        return next === "running" || next === "failed";
      case "running":
        return next === "done";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TieredTicketViewAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered ticket view adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.title}`;
  }

  measuredValue(): number {
    return this.batchSize;
  }

  copy(): TieredTicketViewAdjustment {
    return new TieredTicketViewAdjustment(this.code, this.title, this.label, this.region, this.batchSize, this.status);
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a tiered ticket view adjustment in status new. */
export function newTieredTicketViewAdjustment(code: string, title: string): TieredTicketViewAdjustment {
  return new TieredTicketViewAdjustment(code, title, "", "", 0, "new");
}
