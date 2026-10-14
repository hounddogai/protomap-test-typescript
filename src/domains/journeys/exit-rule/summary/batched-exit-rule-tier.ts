import * as text from "../../../../kit/text.js";

/** Where a batched exit rule tier is in its life cycle. */
export type BatchedExitRuleTierStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a batched exit rule tier and its current status. */
export class BatchedExitRuleTier {
  code: string;
  name: string;
  checksum: string;
  ownerId: string;
  active: boolean;
  quantity: number;
  status: BatchedExitRuleTierStatus;

  constructor(
    code: string,
    name: string,
    checksum: string,
    ownerId: string,
    active: boolean,
    quantity: number,
    status: BatchedExitRuleTierStatus,
  ) {
    this.code = code;
    this.name = name;
    this.checksum = checksum;
    this.ownerId = ownerId;
    this.active = active;
    this.quantity = quantity;
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

  canMoveTo(next: BatchedExitRuleTierStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "active";
      case "pending":
        switch (next) {
          case "active":
          case "closed":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: BatchedExitRuleTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched exit rule tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"batched exit rule tier"} ${this.code}`;
  }

  measuredValue(): number {
    return this.quantity;
  }

  copy(): BatchedExitRuleTier {
    return new BatchedExitRuleTier(
      this.code,
      this.name,
      this.checksum,
      this.ownerId,
      this.active,
      this.quantity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a batched exit rule tier in status draft. */
export function newBatchedExitRuleTier(code: string, name: string): BatchedExitRuleTier {
  return new BatchedExitRuleTier(code, name, "", "", false, 0, "draft");
}
