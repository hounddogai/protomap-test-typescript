import * as text from "../../../../kit/text.js";

/** Where a capped activation slot is in its life cycle. */
export type CappedActivationSlotStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One capped activation slot, with what the planners need to act on it. */
export class CappedActivationSlot {
  code: string;
  name: string;
  priority: number;
  amount: number;
  sendAt: number;
  phone: string;
  frequencyCap: number;
  status: CappedActivationSlotStatus;

  constructor(
    code: string,
    name: string,
    priority: number,
    amount: number,
    sendAt: number,
    phone: string,
    frequencyCap: number,
    status: CappedActivationSlotStatus,
  ) {
    this.code = code;
    this.name = name;
    this.priority = priority;
    this.amount = amount;
    this.sendAt = sendAt;
    this.phone = phone;
    this.frequencyCap = frequencyCap;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: CappedActivationSlotStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected" || next === "withdrawn";
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CappedActivationSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped activation slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"capped activation slot"} ${this.code}`;
  }

  effectiveTotal(): number {
    return Math.round((this.amount - this.sendAt) * 100) / 100;
  }

  copy(): CappedActivationSlot {
    return new CappedActivationSlot(
      this.code,
      this.name,
      this.priority,
      this.amount,
      this.sendAt,
      this.phone,
      this.frequencyCap,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a capped activation slot in status proposed. */
export function newCappedActivationSlot(code: string, name: string): CappedActivationSlot {
  return new CappedActivationSlot(code, name, 0, 0, 0, "", 0, "proposed");
}
