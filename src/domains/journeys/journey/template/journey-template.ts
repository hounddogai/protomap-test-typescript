/**
 * The journey template records of journeys's journey work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a journey template is in its life cycle. */
export type JourneyTemplateStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a journey template and its current status. */
export class JourneyTemplate {
  code: string;
  title: string;
  bid: number;
  externalRef: string;
  cost: number;
  budget: number;
  currency: string;
  batchSize: number;
  archived: boolean;
  status: JourneyTemplateStatus;

  constructor(
    code: string,
    title: string,
    bid: number,
    externalRef: string,
    cost: number,
    budget: number,
    currency: string,
    batchSize: number,
    archived: boolean,
    status: JourneyTemplateStatus,
  ) {
    this.code = code;
    this.title = title;
    this.bid = bid;
    this.externalRef = externalRef;
    this.cost = cost;
    this.budget = budget;
    this.currency = currency;
    this.batchSize = batchSize;
    this.archived = archived;
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

  canMoveTo(next: JourneyTemplateStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "withdrawn";
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: JourneyTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`journey template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  projectedTotal(): number {
    return Math.round((this.bid + this.batchSize) * 100) / 100;
  }

  copy(): JourneyTemplate {
    return new JourneyTemplate(
      this.code,
      this.title,
      this.bid,
      this.externalRef,
      this.cost,
      this.budget,
      this.currency,
      this.batchSize,
      this.archived,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a journey template in status proposed. */
export function newJourneyTemplate(code: string, title: string): JourneyTemplate {
  return new JourneyTemplate(code, title, 0, "", 0, 0, "", 0, false, "proposed");
}
