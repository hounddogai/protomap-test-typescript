import * as text from "../../../../kit/text.js";

/** Where a redemption group is in its life cycle. */
export type RedemptionGroupStatus = "new" | "queued" | "running" | "done" | "failed";

/** A redemption group. Its code is unique within a tenant. */
export class RedemptionGroup {
  code: string;
  name: string;
  unit: string;
  retries: number;
  updatedAt: number;
  status: RedemptionGroupStatus;

  constructor(
    code: string,
    name: string,
    unit: string,
    retries: number,
    updatedAt: number,
    status: RedemptionGroupStatus,
  ) {
    this.code = code;
    this.name = name;
    this.unit = unit;
    this.retries = retries;
    this.updatedAt = updatedAt;
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

  canMoveTo(next: RedemptionGroupStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running" || next === "done";
      case "queued":
        return next === "running";
      case "running":
        return next === "done" || next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: RedemptionGroupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`redemption group ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"redemption group"} ${this.code}`;
  }

  netTotal(): number {
    return Math.round((this.updatedAt - this.retries) * 100) / 100;
  }

  copy(): RedemptionGroup {
    return new RedemptionGroup(this.code, this.name, this.unit, this.retries, this.updatedAt, this.status);
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a redemption group in status new. */
export function newRedemptionGroup(code: string, name: string): RedemptionGroup {
  return new RedemptionGroup(code, name, "", 0, 0, "new");
}
