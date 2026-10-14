import * as text from "../../../../kit/text.js";

/** Where a manual ticket view agreement is in its life cycle. */
export type ManualTicketViewAgreementStatus = "new" | "queued" | "running" | "done" | "failed";

/** A manual ticket view agreement as the ticket view team keeps it. */
export class ManualTicketViewAgreement {
  code: string;
  title: string;
  retries: number;
  archived: boolean;
  channel: string;
  capacity: number;
  rate: number;
  currency: string;
  phone: string;
  status: ManualTicketViewAgreementStatus;

  constructor(
    code: string,
    title: string,
    retries: number,
    archived: boolean,
    channel: string,
    capacity: number,
    rate: number,
    currency: string,
    phone: string,
    status: ManualTicketViewAgreementStatus,
  ) {
    this.code = code;
    this.title = title;
    this.retries = retries;
    this.archived = archived;
    this.channel = channel;
    this.capacity = capacity;
    this.rate = rate;
    this.currency = currency;
    this.phone = phone;
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

  canMoveTo(next: ManualTicketViewAgreementStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "queued":
        return next === "running" || next === "done";
      case "running":
        return next === "done" || next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: ManualTicketViewAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual ticket view agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  netExposure(): number {
    return Math.round((this.capacity + this.rate) * 100) / 100;
  }

  copy(): ManualTicketViewAgreement {
    return new ManualTicketViewAgreement(
      this.code,
      this.title,
      this.retries,
      this.archived,
      this.channel,
      this.capacity,
      this.rate,
      this.currency,
      this.phone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a manual ticket view agreement in status new. */
export function newManualTicketViewAgreement(code: string, title: string): ManualTicketViewAgreement {
  return new ManualTicketViewAgreement(code, title, 0, false, "", 0, 0, "", "", "new");
}
