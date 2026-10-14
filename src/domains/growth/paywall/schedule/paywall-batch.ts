import * as text from "../../../../kit/text.js";

/** Where a paywall batch is in its life cycle. */
export type PaywallBatchStatus = "new" | "queued" | "running" | "done" | "failed";

/** A paywall batch as the paywall team keeps it. */
export class PaywallBatch {
  code: string;
  title: string;
  ratio: number;
  active: boolean;
  retries: number;
  score: number;
  country: string;
  amount: number;
  contactEmail: string;
  threshold: number;
  status: PaywallBatchStatus;

  constructor(
    code: string,
    title: string,
    ratio: number,
    active: boolean,
    retries: number,
    score: number,
    country: string,
    amount: number,
    contactEmail: string,
    threshold: number,
    status: PaywallBatchStatus,
  ) {
    this.code = code;
    this.title = title;
    this.ratio = ratio;
    this.active = active;
    this.retries = retries;
    this.score = score;
    this.country = country;
    this.amount = amount;
    this.contactEmail = contactEmail;
    this.threshold = threshold;
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

  canMoveTo(next: PaywallBatchStatus): boolean {
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
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: PaywallBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`paywall batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  adjustedValue(): number {
    return Math.round((this.threshold + this.score) * 100) / 100;
  }

  copy(): PaywallBatch {
    return new PaywallBatch(
      this.code,
      this.title,
      this.ratio,
      this.active,
      this.retries,
      this.score,
      this.country,
      this.amount,
      this.contactEmail,
      this.threshold,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a paywall batch in status new. */
export function newPaywallBatch(code: string, title: string): PaywallBatch {
  return new PaywallBatch(code, title, 0, false, 0, 0, "", 0, "", 0, "new");
}
