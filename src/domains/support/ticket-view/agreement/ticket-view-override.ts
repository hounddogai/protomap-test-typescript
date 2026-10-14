import * as text from "../../../../kit/text.js";

/** Where a ticket view override is in its life cycle. */
export type TicketViewOverrideStatus = "created" | "validated" | "published" | "retired";

/** The record of a ticket view override and its current status. */
export class TicketViewOverride {
  code: string;
  title: string;
  revision: number;
  discount: number;
  active: boolean;
  status: TicketViewOverrideStatus;

  constructor(
    code: string,
    title: string,
    revision: number,
    discount: number,
    active: boolean,
    status: TicketViewOverrideStatus,
  ) {
    this.code = code;
    this.title = title;
    this.revision = revision;
    this.discount = discount;
    this.active = active;
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

  canMoveTo(next: TicketViewOverrideStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published";
      case "validated":
        return next === "published";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TicketViewOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`ticket view override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  projectedExposure(): number {
    return Math.round(this.discount * this.revision * 100) / 100;
  }

  copy(): TicketViewOverride {
    return new TicketViewOverride(this.code, this.title, this.revision, this.discount, this.active, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a ticket view override in status created. */
export function newTicketViewOverride(code: string, title: string): TicketViewOverride {
  return new TicketViewOverride(code, title, 0, 0, false, "created");
}
