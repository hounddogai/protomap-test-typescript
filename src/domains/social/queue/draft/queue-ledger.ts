import * as text from "../../../../kit/text.js";

/** Where a queue ledger is in its life cycle. */
export type QueueLedgerStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One queue ledger, with what the planners need to act on it. */
export class QueueLedger {
  code: string;
  title: string;
  updatedAt: number;
  attributes: Map<string, string>;
  cohort: string;
  threshold: number;
  externalRef: string;
  status: QueueLedgerStatus;

  constructor(
    code: string,
    title: string,
    updatedAt: number,
    attributes: Map<string, string>,
    cohort: string,
    threshold: number,
    externalRef: string,
    status: QueueLedgerStatus,
  ) {
    this.code = code;
    this.title = title;
    this.updatedAt = updatedAt;
    this.attributes = attributes;
    this.cohort = cohort;
    this.threshold = threshold;
    this.externalRef = externalRef;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: QueueLedgerStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
            return true;
        }
        return false;
      case "in_review":
        return next === "resolved";
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: QueueLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`queue ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  adjustedVolume(): number {
    return Math.round((this.threshold + this.updatedAt) * 100) / 100;
  }

  copy(): QueueLedger {
    return new QueueLedger(
      this.code,
      this.title,
      this.updatedAt,
      this.attributes,
      this.cohort,
      this.threshold,
      this.externalRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a queue ledger in status open. */
export function newQueueLedger(code: string, title: string): QueueLedger {
  return new QueueLedger(code, title, 0, new Map<string, string>(), "", 0, "", "open");
}
