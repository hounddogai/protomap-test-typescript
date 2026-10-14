/**
 * The weighted ticket view agreement records of support's ticket view work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a weighted ticket view agreement is in its life cycle. */
export type WeightedTicketViewAgreementStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A weighted ticket view agreement as the ticket view team keeps it. */
export class WeightedTicketViewAgreement {
  code: string;
  title: string;
  ratio: number;
  cohort: string;
  amount: number;
  channel: string;
  budget: number;
  sequence: number;
  status: WeightedTicketViewAgreementStatus;

  constructor(
    code: string,
    title: string,
    ratio: number,
    cohort: string,
    amount: number,
    channel: string,
    budget: number,
    sequence: number,
    status: WeightedTicketViewAgreementStatus,
  ) {
    this.code = code;
    this.title = title;
    this.ratio = ratio;
    this.cohort = cohort;
    this.amount = amount;
    this.channel = channel;
    this.budget = budget;
    this.sequence = sequence;
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

  canMoveTo(next: WeightedTicketViewAgreementStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming" || next === "ready";
      case "warming":
        return next === "draining";
      case "ready":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WeightedTicketViewAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted ticket view agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  projectedVolume(): number {
    return Math.round(this.budget * this.amount * 100) / 100;
  }

  copy(): WeightedTicketViewAgreement {
    return new WeightedTicketViewAgreement(
      this.code,
      this.title,
      this.ratio,
      this.cohort,
      this.amount,
      this.channel,
      this.budget,
      this.sequence,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a weighted ticket view agreement in status idle. */
export function newWeightedTicketViewAgreement(code: string, title: string): WeightedTicketViewAgreement {
  return new WeightedTicketViewAgreement(code, title, 0, "", 0, "", 0, 0, "idle");
}
