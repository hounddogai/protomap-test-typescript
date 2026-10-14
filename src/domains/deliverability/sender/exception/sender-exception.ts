/**
 * The sender exception records of deliverability's sender work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a sender exception is in its life cycle. */
export type SenderExceptionStatus = "new" | "queued" | "running" | "done" | "failed";

/** A sender exception. Its code is unique within a tenant. */
export class SenderException {
  code: string;
  label: string;
  cost: number;
  locale: string;
  ceiling: number;
  status: SenderExceptionStatus;

  constructor(
    code: string,
    label: string,
    cost: number,
    locale: string,
    ceiling: number,
    status: SenderExceptionStatus,
  ) {
    this.code = code;
    this.label = label;
    this.cost = cost;
    this.locale = locale;
    this.ceiling = ceiling;
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

  canMoveTo(next: SenderExceptionStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "running":
          case "failed":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SenderExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`sender exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  weightedValue(): number {
    return Math.round((this.ceiling - this.cost) * 100) / 100;
  }

  copy(): SenderException {
    return new SenderException(this.code, this.label, this.cost, this.locale, this.ceiling, this.status);
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a sender exception in status new. */
export function newSenderException(code: string, label: string): SenderException {
  return new SenderException(code, label, 0, "", 0, "new");
}
