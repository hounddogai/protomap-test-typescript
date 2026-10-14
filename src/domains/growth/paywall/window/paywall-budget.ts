import * as text from "../../../../kit/text.js";

/** Where a paywall budget is in its life cycle. */
export type PaywallBudgetStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a paywall budget and its current status. */
export class PaywallBudget {
  code: string;
  name: string;
  approved: boolean;
  score: number;
  audienceId: string;
  graceDays: number;
  sequence: number;
  batchSize: number;
  label: string;
  externalRef: string;
  source: string;
  status: PaywallBudgetStatus;

  constructor(
    code: string,
    name: string,
    approved: boolean,
    score: number,
    audienceId: string,
    graceDays: number,
    sequence: number,
    batchSize: number,
    label: string,
    externalRef: string,
    source: string,
    status: PaywallBudgetStatus,
  ) {
    this.code = code;
    this.name = name;
    this.approved = approved;
    this.score = score;
    this.audienceId = audienceId;
    this.graceDays = graceDays;
    this.sequence = sequence;
    this.batchSize = batchSize;
    this.label = label;
    this.externalRef = externalRef;
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

  canMoveTo(next: PaywallBudgetStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
          case "draining":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        return next === "draining";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: PaywallBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`paywall budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"paywall budget"} ${this.code}`;
  }

  projectedTotal(): number {
    return Math.round(this.score * this.batchSize * 100) / 100;
  }

  copy(): PaywallBudget {
    return new PaywallBudget(
      this.code,
      this.name,
      this.approved,
      this.score,
      this.audienceId,
      this.graceDays,
      this.sequence,
      this.batchSize,
      this.label,
      this.externalRef,
      this.source,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a paywall budget in status idle. */
export function newPaywallBudget(code: string, name: string): PaywallBudget {
  return new PaywallBudget(code, name, false, 0, "", 0, 0, 0, "", "", "", "idle");
}
