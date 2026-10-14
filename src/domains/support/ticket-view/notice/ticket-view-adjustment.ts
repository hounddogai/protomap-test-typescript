import * as text from "../../../../kit/text.js";

/** Where a ticket view adjustment is in its life cycle. */
export type TicketViewAdjustmentStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A ticket view adjustment. Its code is unique within a tenant. */
export class TicketViewAdjustment {
  code: string;
  name: string;
  currency: string;
  floorValue: number;
  retries: number;
  locale: string;
  durationMinutes: number;
  priority: number;
  ownerId: string;
  label: string;
  status: TicketViewAdjustmentStatus;

  constructor(
    code: string,
    name: string,
    currency: string,
    floorValue: number,
    retries: number,
    locale: string,
    durationMinutes: number,
    priority: number,
    ownerId: string,
    label: string,
    status: TicketViewAdjustmentStatus,
  ) {
    this.code = code;
    this.name = name;
    this.currency = currency;
    this.floorValue = floorValue;
    this.retries = retries;
    this.locale = locale;
    this.durationMinutes = durationMinutes;
    this.priority = priority;
    this.ownerId = ownerId;
    this.label = label;
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

  canMoveTo(next: TicketViewAdjustmentStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending" || next === "active";
      case "pending":
        return next === "active" || next === "closed";
      case "active":
        switch (next) {
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

  moveTo(next: TicketViewAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`ticket view adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"ticket view adjustment"} ${this.code}`;
  }

  netTotal(): number {
    return Math.round(this.priority * this.retries * 100) / 100;
  }

  copy(): TicketViewAdjustment {
    return new TicketViewAdjustment(
      this.code,
      this.name,
      this.currency,
      this.floorValue,
      this.retries,
      this.locale,
      this.durationMinutes,
      this.priority,
      this.ownerId,
      this.label,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a ticket view adjustment in status draft. */
export function newTicketViewAdjustment(code: string, name: string): TicketViewAdjustment {
  return new TicketViewAdjustment(code, name, "", 0, 0, "", 0, 0, "", "", "draft");
}
