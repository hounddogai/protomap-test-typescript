/**
 * The ticket view request records of support's ticket view work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a ticket view request is in its life cycle. */
export type TicketViewRequestStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A ticket view request as the ticket view team keeps it. */
export class TicketViewRequest {
  code: string;
  label: string;
  name: string;
  active: boolean;
  createdAt: number;
  quantity: number;
  status: TicketViewRequestStatus;

  constructor(
    code: string,
    label: string,
    name: string,
    active: boolean,
    createdAt: number,
    quantity: number,
    status: TicketViewRequestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.name = name;
    this.active = active;
    this.createdAt = createdAt;
    this.quantity = quantity;
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

  canMoveTo(next: TicketViewRequestStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved";
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: TicketViewRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`ticket view request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"ticket view request"} ${this.code}`;
  }

  netTotal(): number {
    return Math.round((this.createdAt + this.quantity) * 100) / 100;
  }

  copy(): TicketViewRequest {
    return new TicketViewRequest(
      this.code,
      this.label,
      this.name,
      this.active,
      this.createdAt,
      this.quantity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a ticket view request in status proposed. */
export function newTicketViewRequest(code: string, label: string): TicketViewRequest {
  return new TicketViewRequest(code, label, "", false, 0, 0, "proposed");
}
