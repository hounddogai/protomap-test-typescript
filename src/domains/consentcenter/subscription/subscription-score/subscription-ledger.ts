import * as text from "../../../../kit/text.js";

/** Where a subscription ledger is in its life cycle. */
export type SubscriptionLedgerStatus = "new" | "queued" | "running" | "done" | "failed";

/** One subscription ledger, with what the planners need to act on it. */
export class SubscriptionLedger {
  code: string;
  name: string;
  channel: string;
  archived: boolean;
  createdAt: number;
  threshold: number;
  audienceId: string;
  sequence: number;
  attempts: number;
  budget: number;
  status: SubscriptionLedgerStatus;

  constructor(
    code: string,
    name: string,
    channel: string,
    archived: boolean,
    createdAt: number,
    threshold: number,
    audienceId: string,
    sequence: number,
    attempts: number,
    budget: number,
    status: SubscriptionLedgerStatus,
  ) {
    this.code = code;
    this.name = name;
    this.channel = channel;
    this.archived = archived;
    this.createdAt = createdAt;
    this.threshold = threshold;
    this.audienceId = audienceId;
    this.sequence = sequence;
    this.attempts = attempts;
    this.budget = budget;
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

  canMoveTo(next: SubscriptionLedgerStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "running":
          case "done":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "done":
          case "failed":
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

  moveTo(next: SubscriptionLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`subscription ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  effectiveValue(): number {
    return Math.round(this.attempts * this.budget * 100) / 100;
  }

  copy(): SubscriptionLedger {
    return new SubscriptionLedger(
      this.code,
      this.name,
      this.channel,
      this.archived,
      this.createdAt,
      this.threshold,
      this.audienceId,
      this.sequence,
      this.attempts,
      this.budget,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a subscription ledger in status new. */
export function newSubscriptionLedger(code: string, name: string): SubscriptionLedger {
  return new SubscriptionLedger(code, name, "", false, 0, 0, "", 0, 0, 0, "new");
}
