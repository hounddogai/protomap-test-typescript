/**
 * The ticket view audit records of support's ticket view work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a ticket view audit is in its life cycle. */
export type TicketViewAuditStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One ticket view audit, with what the planners need to act on it. */
export class TicketViewAudit {
  code: string;
  title: string;
  channel: string;
  segment: string;
  bid: number;
  floorValue: number;
  windowDays: number;
  margin: number;
  status: TicketViewAuditStatus;

  constructor(
    code: string,
    title: string,
    channel: string,
    segment: string,
    bid: number,
    floorValue: number,
    windowDays: number,
    margin: number,
    status: TicketViewAuditStatus,
  ) {
    this.code = code;
    this.title = title;
    this.channel = channel;
    this.segment = segment;
    this.bid = bid;
    this.floorValue = floorValue;
    this.windowDays = windowDays;
    this.margin = margin;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: TicketViewAuditStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "completed";
      case "scheduled":
        return next === "in_progress";
      case "in_progress":
        return next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: TicketViewAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`ticket view audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  effectiveExposure(): number {
    return Math.round((this.floorValue + this.bid) * 100) / 100;
  }

  copy(): TicketViewAudit {
    return new TicketViewAudit(
      this.code,
      this.title,
      this.channel,
      this.segment,
      this.bid,
      this.floorValue,
      this.windowDays,
      this.margin,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a ticket view audit in status planned. */
export function newTicketViewAudit(code: string, title: string): TicketViewAudit {
  return new TicketViewAudit(code, title, "", "", 0, 0, 0, 0, "planned");
}
