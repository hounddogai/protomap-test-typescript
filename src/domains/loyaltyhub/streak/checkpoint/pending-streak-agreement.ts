import * as text from "../../../../kit/text.js";

/** Where a pending streak agreement is in its life cycle. */
export type PendingStreakAgreementStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A pending streak agreement as the streak team keeps it. */
export class PendingStreakAgreement {
  code: string;
  title: string;
  margin: number;
  discount: number;
  budget: number;
  country: string;
  notes: string;
  channel: string;
  source: string;
  status: PendingStreakAgreementStatus;

  constructor(
    code: string,
    title: string,
    margin: number,
    discount: number,
    budget: number,
    country: string,
    notes: string,
    channel: string,
    source: string,
    status: PendingStreakAgreementStatus,
  ) {
    this.code = code;
    this.title = title;
    this.margin = margin;
    this.discount = discount;
    this.budget = budget;
    this.country = country;
    this.notes = notes;
    this.channel = channel;
    this.source = source;
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

  canMoveTo(next: PendingStreakAgreementStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "draining" || next === "stopped";
      case "warming":
        switch (next) {
          case "ready":
          case "draining":
            return true;
        }
        return false;
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

  moveTo(next: PendingStreakAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending streak agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"pending streak agreement"} ${this.code}`;
  }

  weightedLoad(): number {
    return Math.round(this.discount * this.margin * 100) / 100;
  }

  copy(): PendingStreakAgreement {
    return new PendingStreakAgreement(
      this.code,
      this.title,
      this.margin,
      this.discount,
      this.budget,
      this.country,
      this.notes,
      this.channel,
      this.source,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a pending streak agreement in status idle. */
export function newPendingStreakAgreement(code: string, title: string): PendingStreakAgreement {
  return new PendingStreakAgreement(code, title, 0, 0, 0, "", "", "", "", "idle");
}
