import * as text from "../../../../kit/text.js";

/** Where a manual tier cycle is in its life cycle. */
export type ManualTierCycleStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A manual tier cycle as the tier team keeps it. */
export class ManualTierCycle {
  code: string;
  name: string;
  campaignRef: string;
  visible: boolean;
  approved: boolean;
  amount: number;
  status: ManualTierCycleStatus;

  constructor(
    code: string,
    name: string,
    campaignRef: string,
    visible: boolean,
    approved: boolean,
    amount: number,
    status: ManualTierCycleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.campaignRef = campaignRef;
    this.visible = visible;
    this.approved = approved;
    this.amount = amount;
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

  canMoveTo(next: ManualTierCycleStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "completed";
      case "scheduled":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
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

  moveTo(next: ManualTierCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual tier cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  measuredValue(): number {
    return this.amount;
  }

  copy(): ManualTierCycle {
    return new ManualTierCycle(
      this.code,
      this.name,
      this.campaignRef,
      this.visible,
      this.approved,
      this.amount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a manual tier cycle in status planned. */
export function newManualTierCycle(code: string, name: string): ManualTierCycle {
  return new ManualTierCycle(code, name, "", false, false, 0, "planned");
}
