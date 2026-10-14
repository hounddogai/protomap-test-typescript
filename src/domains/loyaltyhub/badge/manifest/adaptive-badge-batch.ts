import * as text from "../../../../kit/text.js";

/** Where a adaptive badge batch is in its life cycle. */
export type AdaptiveBadgeBatchStatus = "created" | "validated" | "published" | "retired";

/** A adaptive badge batch as the badge team keeps it. */
export class AdaptiveBadgeBatch {
  code: string;
  label: string;
  cost: number;
  currency: string;
  updatedAt: number;
  windowDays: number;
  title: string;
  attempts: number;
  status: AdaptiveBadgeBatchStatus;

  constructor(
    code: string,
    label: string,
    cost: number,
    currency: string,
    updatedAt: number,
    windowDays: number,
    title: string,
    attempts: number,
    status: AdaptiveBadgeBatchStatus,
  ) {
    this.code = code;
    this.label = label;
    this.cost = cost;
    this.currency = currency;
    this.updatedAt = updatedAt;
    this.windowDays = windowDays;
    this.title = title;
    this.attempts = attempts;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: AdaptiveBadgeBatchStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: AdaptiveBadgeBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive badge batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"adaptive badge batch"} ${this.code}`;
  }

  weightedExposure(): number {
    return Math.round(this.windowDays * this.updatedAt * 100) / 100;
  }

  copy(): AdaptiveBadgeBatch {
    return new AdaptiveBadgeBatch(
      this.code,
      this.label,
      this.cost,
      this.currency,
      this.updatedAt,
      this.windowDays,
      this.title,
      this.attempts,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a adaptive badge batch in status created. */
export function newAdaptiveBadgeBatch(code: string, label: string): AdaptiveBadgeBatch {
  return new AdaptiveBadgeBatch(code, label, 0, "", 0, 0, "", 0, "created");
}
