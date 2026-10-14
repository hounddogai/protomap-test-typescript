import * as text from "../../../../kit/text.js";

/** Where a global placement ledger is in its life cycle. */
export type GlobalPlacementLedgerStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A global placement ledger. Its code is unique within a tenant. */
export class GlobalPlacementLedger {
  code: string;
  title: string;
  startsAt: number;
  active: boolean;
  cost: number;
  description: string;
  status: GlobalPlacementLedgerStatus;

  constructor(
    code: string,
    title: string,
    startsAt: number,
    active: boolean,
    cost: number,
    description: string,
    status: GlobalPlacementLedgerStatus,
  ) {
    this.code = code;
    this.title = title;
    this.startsAt = startsAt;
    this.active = active;
    this.cost = cost;
    this.description = description;
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

  canMoveTo(next: GlobalPlacementLedgerStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
          case "draining":
            return true;
        }
        return false;
      case "warming":
        return next === "ready" || next === "draining";
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: GlobalPlacementLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global placement ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"global placement ledger"} ${this.code}`;
  }

  projectedVolume(): number {
    return Math.round(this.startsAt * this.cost * 100) / 100;
  }

  copy(): GlobalPlacementLedger {
    return new GlobalPlacementLedger(
      this.code,
      this.title,
      this.startsAt,
      this.active,
      this.cost,
      this.description,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a global placement ledger in status idle. */
export function newGlobalPlacementLedger(code: string, title: string): GlobalPlacementLedger {
  return new GlobalPlacementLedger(code, title, 0, false, 0, "", "idle");
}
