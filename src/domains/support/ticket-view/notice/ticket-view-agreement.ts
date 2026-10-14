import * as text from "../../../../kit/text.js";

/** Where a ticket view agreement is in its life cycle. */
export type TicketViewAgreementStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a ticket view agreement and its current status. */
export class TicketViewAgreement {
  code: string;
  name: string;
  margin: number;
  timezone: string;
  channel: string;
  status: TicketViewAgreementStatus;

  constructor(
    code: string,
    name: string,
    margin: number,
    timezone: string,
    channel: string,
    status: TicketViewAgreementStatus,
  ) {
    this.code = code;
    this.name = name;
    this.margin = margin;
    this.timezone = timezone;
    this.channel = channel;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: TicketViewAgreementStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "running":
          case "failed":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "running":
        return next === "done" || next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TicketViewAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`ticket view agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  measuredValue(): number {
    return this.margin;
  }

  copy(): TicketViewAgreement {
    return new TicketViewAgreement(this.code, this.name, this.margin, this.timezone, this.channel, this.status);
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a ticket view agreement in status new. */
export function newTicketViewAgreement(code: string, name: string): TicketViewAgreement {
  return new TicketViewAgreement(code, name, 0, "", "", "new");
}
