import * as text from "../../../../kit/text.js";

/** Where a ticket view preference is in its life cycle. */
export type TicketViewPreferenceStatus = "created" | "validated" | "published" | "retired";

/** A ticket view preference. Its code is unique within a tenant. */
export class TicketViewPreference {
  code: string;
  title: string;
  channel: string;
  clicks: number;
  locale: string;
  rate: number;
  bid: number;
  endsAt: number;
  status: TicketViewPreferenceStatus;

  constructor(
    code: string,
    title: string,
    channel: string,
    clicks: number,
    locale: string,
    rate: number,
    bid: number,
    endsAt: number,
    status: TicketViewPreferenceStatus,
  ) {
    this.code = code;
    this.title = title;
    this.channel = channel;
    this.clicks = clicks;
    this.locale = locale;
    this.rate = rate;
    this.bid = bid;
    this.endsAt = endsAt;
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

  canMoveTo(next: TicketViewPreferenceStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "published":
            return true;
        }
        return false;
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TicketViewPreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`ticket view preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  projectedVolume(): number {
    return Math.round((this.endsAt + this.bid) * 100) / 100;
  }

  copy(): TicketViewPreference {
    return new TicketViewPreference(
      this.code,
      this.title,
      this.channel,
      this.clicks,
      this.locale,
      this.rate,
      this.bid,
      this.endsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a ticket view preference in status created. */
export function newTicketViewPreference(code: string, title: string): TicketViewPreference {
  return new TicketViewPreference(code, title, "", 0, "", 0, 0, 0, "created");
}
