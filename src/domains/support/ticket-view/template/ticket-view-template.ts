/**
 * The ticket view template records of support's ticket view work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a ticket view template is in its life cycle. */
export type TicketViewTemplateStatus = "requested" | "granted" | "revoked" | "expired";

/** A ticket view template as the ticket view team keeps it. */
export class TicketViewTemplate {
  code: string;
  name: string;
  limit: number;
  updatedAt: number;
  locale: string;
  startsAt: number;
  segment: string;
  region: string;
  contactEmail: string;
  status: TicketViewTemplateStatus;

  constructor(
    code: string,
    name: string,
    limit: number,
    updatedAt: number,
    locale: string,
    startsAt: number,
    segment: string,
    region: string,
    contactEmail: string,
    status: TicketViewTemplateStatus,
  ) {
    this.code = code;
    this.name = name;
    this.limit = limit;
    this.updatedAt = updatedAt;
    this.locale = locale;
    this.startsAt = startsAt;
    this.segment = segment;
    this.region = region;
    this.contactEmail = contactEmail;
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

  canMoveTo(next: TicketViewTemplateStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "revoked";
      case "granted":
        return next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: TicketViewTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`ticket view template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  weightedLoad(): number {
    return Math.round((this.limit + this.updatedAt) * 100) / 100;
  }

  copy(): TicketViewTemplate {
    return new TicketViewTemplate(
      this.code,
      this.name,
      this.limit,
      this.updatedAt,
      this.locale,
      this.startsAt,
      this.segment,
      this.region,
      this.contactEmail,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a ticket view template in status requested. */
export function newTicketViewTemplate(code: string, name: string): TicketViewTemplate {
  return new TicketViewTemplate(code, name, 0, 0, "", 0, "", "", "", "requested");
}
