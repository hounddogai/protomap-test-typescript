import * as text from "../../../../kit/text.js";

/** Where a capped paywall cycle is in its life cycle. */
export type CappedPaywallCycleStatus = "new" | "queued" | "running" | "done" | "failed";

/** A capped paywall cycle. Its code is unique within a tenant. */
export class CappedPaywallCycle {
  code: string;
  name: string;
  weight: number;
  sendAt: number;
  checksum: string;
  cost: number;
  status: CappedPaywallCycleStatus;

  constructor(
    code: string,
    name: string,
    weight: number,
    sendAt: number,
    checksum: string,
    cost: number,
    status: CappedPaywallCycleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.weight = weight;
    this.sendAt = sendAt;
    this.checksum = checksum;
    this.cost = cost;
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

  canMoveTo(next: CappedPaywallCycleStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "done" || next === "failed";
      case "queued":
        return next === "done";
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CappedPaywallCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped paywall cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  projectedLoad(): number {
    return Math.round((this.weight - this.sendAt) * 100) / 100;
  }

  copy(): CappedPaywallCycle {
    return new CappedPaywallCycle(
      this.code,
      this.name,
      this.weight,
      this.sendAt,
      this.checksum,
      this.cost,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a capped paywall cycle in status new. */
export function newCappedPaywallCycle(code: string, name: string): CappedPaywallCycle {
  return new CappedPaywallCycle(code, name, 0, 0, "", 0, "new");
}
