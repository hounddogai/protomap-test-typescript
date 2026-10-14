import * as text from "../../../../kit/text.js";

/** Where a strict reward rule reservation is in its life cycle. */
export type StrictRewardRuleReservationStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A strict reward rule reservation as the reward rule team keeps it. */
export class StrictRewardRuleReservation {
  code: string;
  title: string;
  pinned: boolean;
  externalRef: string;
  sequence: number;
  active: boolean;
  cost: number;
  amount: number;
  status: StrictRewardRuleReservationStatus;

  constructor(
    code: string,
    title: string,
    pinned: boolean,
    externalRef: string,
    sequence: number,
    active: boolean,
    cost: number,
    amount: number,
    status: StrictRewardRuleReservationStatus,
  ) {
    this.code = code;
    this.title = title;
    this.pinned = pinned;
    this.externalRef = externalRef;
    this.sequence = sequence;
    this.active = active;
    this.cost = cost;
    this.amount = amount;
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

  canMoveTo(next: StrictRewardRuleReservationStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled" || next === "cancelled";
      case "scheduled":
        return next === "completed" || next === "cancelled";
      case "in_progress":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: StrictRewardRuleReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict reward rule reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"strict reward rule reservation"} ${this.code}`;
  }

  adjustedVolume(): number {
    return Math.round((this.sequence + this.amount) * 100) / 100;
  }

  copy(): StrictRewardRuleReservation {
    return new StrictRewardRuleReservation(
      this.code,
      this.title,
      this.pinned,
      this.externalRef,
      this.sequence,
      this.active,
      this.cost,
      this.amount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a strict reward rule reservation in status planned. */
export function newStrictRewardRuleReservation(code: string, title: string): StrictRewardRuleReservation {
  return new StrictRewardRuleReservation(code, title, false, "", 0, false, 0, 0, "planned");
}
