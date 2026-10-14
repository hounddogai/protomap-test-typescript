import * as text from "../../../../kit/text.js";

/** Where a rolling macro assignment is in its life cycle. */
export type RollingMacroAssignmentStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A rolling macro assignment. Its code is unique within a tenant. */
export class RollingMacroAssignment {
  code: string;
  name: string;
  channel: string;
  capacity: number;
  sequence: number;
  revision: number;
  currency: string;
  bid: number;
  locale: string;
  amount: number;
  status: RollingMacroAssignmentStatus;

  constructor(
    code: string,
    name: string,
    channel: string,
    capacity: number,
    sequence: number,
    revision: number,
    currency: string,
    bid: number,
    locale: string,
    amount: number,
    status: RollingMacroAssignmentStatus,
  ) {
    this.code = code;
    this.name = name;
    this.channel = channel;
    this.capacity = capacity;
    this.sequence = sequence;
    this.revision = revision;
    this.currency = currency;
    this.bid = bid;
    this.locale = locale;
    this.amount = amount;
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

  canMoveTo(next: RollingMacroAssignmentStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "active":
        return next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: RollingMacroAssignmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling macro assignment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  projectedExposure(): number {
    return Math.round(this.capacity * this.revision * 100) / 100;
  }

  copy(): RollingMacroAssignment {
    return new RollingMacroAssignment(
      this.code,
      this.name,
      this.channel,
      this.capacity,
      this.sequence,
      this.revision,
      this.currency,
      this.bid,
      this.locale,
      this.amount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a rolling macro assignment in status draft. */
export function newRollingMacroAssignment(code: string, name: string): RollingMacroAssignment {
  return new RollingMacroAssignment(code, name, "", 0, 0, 0, "", 0, "", 0, "draft");
}
