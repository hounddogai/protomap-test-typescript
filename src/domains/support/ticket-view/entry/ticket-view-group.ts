import * as text from "../../../../kit/text.js";

/** Where a ticket view group is in its life cycle. */
export type TicketViewGroupStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A ticket view group. Its code is unique within a tenant. */
export class TicketViewGroup {
  code: string;
  label: string;
  pinned: boolean;
  approved: boolean;
  locale: string;
  budget: number;
  status: TicketViewGroupStatus;

  constructor(
    code: string,
    label: string,
    pinned: boolean,
    approved: boolean,
    locale: string,
    budget: number,
    status: TicketViewGroupStatus,
  ) {
    this.code = code;
    this.label = label;
    this.pinned = pinned;
    this.approved = approved;
    this.locale = locale;
    this.budget = budget;
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

  canMoveTo(next: TicketViewGroupStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending";
      case "pending":
        return next === "suspended";
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TicketViewGroupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`ticket view group ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  measuredValue(): number {
    return this.budget;
  }

  copy(): TicketViewGroup {
    return new TicketViewGroup(
      this.code,
      this.label,
      this.pinned,
      this.approved,
      this.locale,
      this.budget,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a ticket view group in status draft. */
export function newTicketViewGroup(code: string, label: string): TicketViewGroup {
  return new TicketViewGroup(code, label, false, false, "", 0, "draft");
}
