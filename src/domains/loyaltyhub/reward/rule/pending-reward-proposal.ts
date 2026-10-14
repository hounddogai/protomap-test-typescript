import * as text from "../../../../kit/text.js";

/** Where a pending reward proposal is in its life cycle. */
export type PendingRewardProposalStatus = "created" | "validated" | "published" | "retired";

/** The record of a pending reward proposal and its current status. */
export class PendingRewardProposal {
  code: string;
  name: string;
  capacity: number;
  quantity: number;
  priority: number;
  clicks: number;
  currency: string;
  visible: boolean;
  status: PendingRewardProposalStatus;

  constructor(
    code: string,
    name: string,
    capacity: number,
    quantity: number,
    priority: number,
    clicks: number,
    currency: string,
    visible: boolean,
    status: PendingRewardProposalStatus,
  ) {
    this.code = code;
    this.name = name;
    this.capacity = capacity;
    this.quantity = quantity;
    this.priority = priority;
    this.clicks = clicks;
    this.currency = currency;
    this.visible = visible;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: PendingRewardProposalStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated" || next === "retired";
      case "validated":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PendingRewardProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending reward proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  adjustedValue(): number {
    return Math.round((this.priority + this.clicks) * 100) / 100;
  }

  copy(): PendingRewardProposal {
    return new PendingRewardProposal(
      this.code,
      this.name,
      this.capacity,
      this.quantity,
      this.priority,
      this.clicks,
      this.currency,
      this.visible,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a pending reward proposal in status created. */
export function newPendingRewardProposal(code: string, name: string): PendingRewardProposal {
  return new PendingRewardProposal(code, name, 0, 0, 0, 0, "", false, "created");
}
