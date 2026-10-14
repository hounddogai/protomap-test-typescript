/**
 * The strict ticket view batch records of support's ticket view work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a strict ticket view batch is in its life cycle. */
export type StrictTicketViewBatchStatus = "new" | "queued" | "running" | "done" | "failed";

/** One strict ticket view batch, with what the planners need to act on it. */
export class StrictTicketViewBatch {
  code: string;
  name: string;
  ownerId: string;
  externalRef: string;
  category: string;
  locale: string;
  unit: string;
  amount: number;
  status: StrictTicketViewBatchStatus;

  constructor(
    code: string,
    name: string,
    ownerId: string,
    externalRef: string,
    category: string,
    locale: string,
    unit: string,
    amount: number,
    status: StrictTicketViewBatchStatus,
  ) {
    this.code = code;
    this.name = name;
    this.ownerId = ownerId;
    this.externalRef = externalRef;
    this.category = category;
    this.locale = locale;
    this.unit = unit;
    this.amount = amount;
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

  canMoveTo(next: StrictTicketViewBatchStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "running":
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
          case "failed":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: StrictTicketViewBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict ticket view batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  measuredValue(): number {
    return this.amount;
  }

  copy(): StrictTicketViewBatch {
    return new StrictTicketViewBatch(
      this.code,
      this.name,
      this.ownerId,
      this.externalRef,
      this.category,
      this.locale,
      this.unit,
      this.amount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a strict ticket view batch in status new. */
export function newStrictTicketViewBatch(code: string, name: string): StrictTicketViewBatch {
  return new StrictTicketViewBatch(code, name, "", "", "", "", "", 0, "new");
}
