/**
 * The ticket view draft records of support's ticket view work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a ticket view draft is in its life cycle. */
export type TicketViewDraftStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a ticket view draft and its current status. */
export class TicketViewDraft {
  code: string;
  title: string;
  variant: string;
  journeyId: string;
  margin: number;
  frequencyCap: number;
  maximum: number;
  country: string;
  openRate: number;
  createdAt: number;
  status: TicketViewDraftStatus;

  constructor(
    code: string,
    title: string,
    variant: string,
    journeyId: string,
    margin: number,
    frequencyCap: number,
    maximum: number,
    country: string,
    openRate: number,
    createdAt: number,
    status: TicketViewDraftStatus,
  ) {
    this.code = code;
    this.title = title;
    this.variant = variant;
    this.journeyId = journeyId;
    this.margin = margin;
    this.frequencyCap = frequencyCap;
    this.maximum = maximum;
    this.country = country;
    this.openRate = openRate;
    this.createdAt = createdAt;
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

  canMoveTo(next: TicketViewDraftStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming" || next === "ready";
      case "warming":
        return next === "ready";
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: TicketViewDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`ticket view draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"ticket view draft"} ${this.code}`;
  }

  adjustedExposure(): number {
    return Math.round(this.createdAt * this.maximum * 100) / 100;
  }

  copy(): TicketViewDraft {
    return new TicketViewDraft(
      this.code,
      this.title,
      this.variant,
      this.journeyId,
      this.margin,
      this.frequencyCap,
      this.maximum,
      this.country,
      this.openRate,
      this.createdAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a ticket view draft in status idle. */
export function newTicketViewDraft(code: string, title: string): TicketViewDraft {
  return new TicketViewDraft(code, title, "", "", 0, 0, 0, "", 0, 0, "idle");
}
