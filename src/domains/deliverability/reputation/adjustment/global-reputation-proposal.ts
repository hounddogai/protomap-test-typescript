import * as text from "../../../../kit/text.js";

/** Where a global reputation proposal is in its life cycle. */
export type GlobalReputationProposalStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A global reputation proposal as the reputation team keeps it. */
export class GlobalReputationProposal {
  code: string;
  name: string;
  amount: number;
  createdAt: number;
  priority: number;
  quantity: number;
  channel: string;
  budget: number;
  visible: boolean;
  status: GlobalReputationProposalStatus;

  constructor(
    code: string,
    name: string,
    amount: number,
    createdAt: number,
    priority: number,
    quantity: number,
    channel: string,
    budget: number,
    visible: boolean,
    status: GlobalReputationProposalStatus,
  ) {
    this.code = code;
    this.name = name;
    this.amount = amount;
    this.createdAt = createdAt;
    this.priority = priority;
    this.quantity = quantity;
    this.channel = channel;
    this.budget = budget;
    this.visible = visible;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: GlobalReputationProposalStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress";
      case "scheduled":
        return next === "cancelled";
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: GlobalReputationProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global reputation proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  netTotal(): number {
    return Math.round(this.amount * this.createdAt * 100) / 100;
  }

  copy(): GlobalReputationProposal {
    return new GlobalReputationProposal(
      this.code,
      this.name,
      this.amount,
      this.createdAt,
      this.priority,
      this.quantity,
      this.channel,
      this.budget,
      this.visible,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a global reputation proposal in status planned. */
export function newGlobalReputationProposal(code: string, name: string): GlobalReputationProposal {
  return new GlobalReputationProposal(code, name, 0, 0, 0, 0, "", 0, false, "planned");
}
