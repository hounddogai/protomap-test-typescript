import * as text from "../../../../kit/text.js";

/** Where a ticket view entry is in its life cycle. */
export type TicketViewEntryStatus = "requested" | "granted" | "revoked" | "expired";

/** A ticket view entry as the ticket view team keeps it. */
export class TicketViewEntry {
  code: string;
  title: string;
  locale: string;
  revision: number;
  attempts: number;
  endsAt: number;
  cost: number;
  checksum: string;
  status: TicketViewEntryStatus;

  constructor(
    code: string,
    title: string,
    locale: string,
    revision: number,
    attempts: number,
    endsAt: number,
    cost: number,
    checksum: string,
    status: TicketViewEntryStatus,
  ) {
    this.code = code;
    this.title = title;
    this.locale = locale;
    this.revision = revision;
    this.attempts = attempts;
    this.endsAt = endsAt;
    this.cost = cost;
    this.checksum = checksum;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: TicketViewEntryStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: TicketViewEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`ticket view entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  weightedTotal(): number {
    return Math.round((this.endsAt - this.cost) * 100) / 100;
  }

  copy(): TicketViewEntry {
    return new TicketViewEntry(
      this.code,
      this.title,
      this.locale,
      this.revision,
      this.attempts,
      this.endsAt,
      this.cost,
      this.checksum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a ticket view entry in status requested. */
export function newTicketViewEntry(code: string, title: string): TicketViewEntry {
  return new TicketViewEntry(code, title, "", 0, 0, 0, 0, "", "requested");
}
