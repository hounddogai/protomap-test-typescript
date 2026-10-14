import * as text from "../../../../kit/text.js";

/** Where a legacy ticket view cycle is in its life cycle. */
export type LegacyTicketViewCycleStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A legacy ticket view cycle as the ticket view team keeps it. */
export class LegacyTicketViewCycle {
  code: string;
  name: string;
  endsAt: number;
  notes: string;
  summary: string;
  status: LegacyTicketViewCycleStatus;

  constructor(
    code: string,
    name: string,
    endsAt: number,
    notes: string,
    summary: string,
    status: LegacyTicketViewCycleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.endsAt = endsAt;
    this.notes = notes;
    this.summary = summary;
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

  canMoveTo(next: LegacyTicketViewCycleStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: LegacyTicketViewCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy ticket view cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  measuredValue(): number {
    return this.endsAt;
  }

  copy(): LegacyTicketViewCycle {
    return new LegacyTicketViewCycle(this.code, this.name, this.endsAt, this.notes, this.summary, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a legacy ticket view cycle in status proposed. */
export function newLegacyTicketViewCycle(code: string, name: string): LegacyTicketViewCycle {
  return new LegacyTicketViewCycle(code, name, 0, "", "", "proposed");
}
