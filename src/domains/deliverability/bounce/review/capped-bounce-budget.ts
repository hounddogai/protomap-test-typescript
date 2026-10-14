import * as text from "../../../../kit/text.js";

/** Where a capped bounce budget is in its life cycle. */
export type CappedBounceBudgetStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a capped bounce budget and its current status. */
export class CappedBounceBudget {
  code: string;
  name: string;
  frequencyCap: number;
  locale: string;
  score: number;
  channel: string;
  status: CappedBounceBudgetStatus;

  constructor(
    code: string,
    name: string,
    frequencyCap: number,
    locale: string,
    score: number,
    channel: string,
    status: CappedBounceBudgetStatus,
  ) {
    this.code = code;
    this.name = name;
    this.frequencyCap = frequencyCap;
    this.locale = locale;
    this.score = score;
    this.channel = channel;
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

  canMoveTo(next: CappedBounceBudgetStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "rejected";
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: CappedBounceBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped bounce budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  netVolume(): number {
    return Math.round((this.frequencyCap - this.score) * 100) / 100;
  }

  copy(): CappedBounceBudget {
    return new CappedBounceBudget(
      this.code,
      this.name,
      this.frequencyCap,
      this.locale,
      this.score,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a capped bounce budget in status proposed. */
export function newCappedBounceBudget(code: string, name: string): CappedBounceBudget {
  return new CappedBounceBudget(code, name, 0, "", 0, "", "proposed");
}
