import * as text from "../../../../kit/text.js";

/** Where a ticket view budget is in its life cycle. */
export type TicketViewBudgetStatus = "requested" | "granted" | "revoked" | "expired";

/** A ticket view budget as the ticket view team keeps it. */
export class TicketViewBudget {
  code: string;
  title: string;
  source: string;
  channel: string;
  impressions: number;
  externalRef: string;
  ceiling: number;
  country: string;
  discount: number;
  windowDays: number;
  archived: boolean;
  status: TicketViewBudgetStatus;

  constructor(
    code: string,
    title: string,
    source: string,
    channel: string,
    impressions: number,
    externalRef: string,
    ceiling: number,
    country: string,
    discount: number,
    windowDays: number,
    archived: boolean,
    status: TicketViewBudgetStatus,
  ) {
    this.code = code;
    this.title = title;
    this.source = source;
    this.channel = channel;
    this.impressions = impressions;
    this.externalRef = externalRef;
    this.ceiling = ceiling;
    this.country = country;
    this.discount = discount;
    this.windowDays = windowDays;
    this.archived = archived;
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

  canMoveTo(next: TicketViewBudgetStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "revoked";
      case "granted":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: TicketViewBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`ticket view budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  adjustedExposure(): number {
    return Math.round((this.impressions - this.ceiling) * 100) / 100;
  }

  copy(): TicketViewBudget {
    return new TicketViewBudget(
      this.code,
      this.title,
      this.source,
      this.channel,
      this.impressions,
      this.externalRef,
      this.ceiling,
      this.country,
      this.discount,
      this.windowDays,
      this.archived,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a ticket view budget in status requested. */
export function newTicketViewBudget(code: string, title: string): TicketViewBudget {
  return new TicketViewBudget(code, title, "", "", 0, "", 0, "", 0, 0, false, "requested");
}
