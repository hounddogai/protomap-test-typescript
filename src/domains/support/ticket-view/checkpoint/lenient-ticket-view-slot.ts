import * as text from "../../../../kit/text.js";

/** Where a lenient ticket view slot is in its life cycle. */
export type LenientTicketViewSlotStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One lenient ticket view slot, with what the planners need to act on it. */
export class LenientTicketViewSlot {
  code: string;
  title: string;
  revision: number;
  reviewer: string;
  cost: number;
  active: boolean;
  status: LenientTicketViewSlotStatus;

  constructor(
    code: string,
    title: string,
    revision: number,
    reviewer: string,
    cost: number,
    active: boolean,
    status: LenientTicketViewSlotStatus,
  ) {
    this.code = code;
    this.title = title;
    this.revision = revision;
    this.reviewer = reviewer;
    this.cost = cost;
    this.active = active;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: LenientTicketViewSlotStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        return next === "draining" || next === "stopped";
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: LenientTicketViewSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient ticket view slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  weightedValue(): number {
    return Math.round(this.cost * this.revision * 100) / 100;
  }

  copy(): LenientTicketViewSlot {
    return new LenientTicketViewSlot(
      this.code,
      this.title,
      this.revision,
      this.reviewer,
      this.cost,
      this.active,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a lenient ticket view slot in status idle. */
export function newLenientTicketViewSlot(code: string, title: string): LenientTicketViewSlot {
  return new LenientTicketViewSlot(code, title, 0, "", 0, false, "idle");
}
