/**
 * The ticket view score records of support's ticket view work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a ticket view score is in its life cycle. */
export type TicketViewScoreStatus = "created" | "validated" | "published" | "retired";

/** A ticket view score as the ticket view team keeps it. */
export class TicketViewScore {
  code: string;
  label: string;
  region: string;
  campaignRef: string;
  archived: boolean;
  weight: number;
  unit: string;
  ratio: number;
  priority: number;
  rate: number;
  status: TicketViewScoreStatus;

  constructor(
    code: string,
    label: string,
    region: string,
    campaignRef: string,
    archived: boolean,
    weight: number,
    unit: string,
    ratio: number,
    priority: number,
    rate: number,
    status: TicketViewScoreStatus,
  ) {
    this.code = code;
    this.label = label;
    this.region = region;
    this.campaignRef = campaignRef;
    this.archived = archived;
    this.weight = weight;
    this.unit = unit;
    this.ratio = ratio;
    this.priority = priority;
    this.rate = rate;
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

  canMoveTo(next: TicketViewScoreStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: TicketViewScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`ticket view score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  projectedTotal(): number {
    return Math.round(this.ratio * this.rate * 100) / 100;
  }

  copy(): TicketViewScore {
    return new TicketViewScore(
      this.code,
      this.label,
      this.region,
      this.campaignRef,
      this.archived,
      this.weight,
      this.unit,
      this.ratio,
      this.priority,
      this.rate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a ticket view score in status created. */
export function newTicketViewScore(code: string, label: string): TicketViewScore {
  return new TicketViewScore(code, label, "", "", false, 0, "", 0, 0, 0, "created");
}
