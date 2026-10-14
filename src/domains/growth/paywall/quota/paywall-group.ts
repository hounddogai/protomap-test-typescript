import * as text from "../../../../kit/text.js";

/** Where a paywall group is in its life cycle. */
export type PaywallGroupStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a paywall group and its current status. */
export class PaywallGroup {
  code: string;
  title: string;
  budget: number;
  channel: string;
  floorValue: number;
  notes: string;
  cohort: string;
  status: PaywallGroupStatus;

  constructor(
    code: string,
    title: string,
    budget: number,
    channel: string,
    floorValue: number,
    notes: string,
    cohort: string,
    status: PaywallGroupStatus,
  ) {
    this.code = code;
    this.title = title;
    this.budget = budget;
    this.channel = channel;
    this.floorValue = floorValue;
    this.notes = notes;
    this.cohort = cohort;
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

  canMoveTo(next: PaywallGroupStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running";
      case "queued":
        return next === "running" || next === "done";
      case "running":
        return next === "done";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: PaywallGroupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`paywall group ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  weightedTotal(): number {
    return Math.round((this.floorValue + this.budget) * 100) / 100;
  }

  copy(): PaywallGroup {
    return new PaywallGroup(
      this.code,
      this.title,
      this.budget,
      this.channel,
      this.floorValue,
      this.notes,
      this.cohort,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a paywall group in status new. */
export function newPaywallGroup(code: string, title: string): PaywallGroup {
  return new PaywallGroup(code, title, 0, "", 0, "", "", "new");
}
