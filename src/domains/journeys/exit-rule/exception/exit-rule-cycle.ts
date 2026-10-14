import * as text from "../../../../kit/text.js";

/** Where a exit rule cycle is in its life cycle. */
export type ExitRuleCycleStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a exit rule cycle and its current status. */
export class ExitRuleCycle {
  code: string;
  title: string;
  score: number;
  weight: number;
  label: string;
  externalRef: string;
  amount: number;
  checksum: string;
  cohort: string;
  status: ExitRuleCycleStatus;

  constructor(
    code: string,
    title: string,
    score: number,
    weight: number,
    label: string,
    externalRef: string,
    amount: number,
    checksum: string,
    cohort: string,
    status: ExitRuleCycleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.score = score;
    this.weight = weight;
    this.label = label;
    this.externalRef = externalRef;
    this.amount = amount;
    this.checksum = checksum;
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

  canMoveTo(next: ExitRuleCycleStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued";
      case "queued":
        switch (next) {
          case "running":
            return true;
        }
        return false;
      case "running":
        return next === "done" || next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: ExitRuleCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`exit rule cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.title}`;
  }

  projectedTotal(): number {
    return Math.round(this.amount * this.score * 100) / 100;
  }

  copy(): ExitRuleCycle {
    return new ExitRuleCycle(
      this.code,
      this.title,
      this.score,
      this.weight,
      this.label,
      this.externalRef,
      this.amount,
      this.checksum,
      this.cohort,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a exit rule cycle in status new. */
export function newExitRuleCycle(code: string, title: string): ExitRuleCycle {
  return new ExitRuleCycle(code, title, 0, 0, "", "", 0, "", "", "new");
}
