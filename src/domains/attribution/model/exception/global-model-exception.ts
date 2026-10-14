/**
 * The global model exception records of attribution's model work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a global model exception is in its life cycle. */
export type GlobalModelExceptionStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a global model exception and its current status. */
export class GlobalModelException {
  code: string;
  title: string;
  currency: string;
  approved: boolean;
  maximum: number;
  locale: string;
  limit: number;
  quantity: number;
  notes: string;
  name: string;
  score: number;
  status: GlobalModelExceptionStatus;

  constructor(
    code: string,
    title: string,
    currency: string,
    approved: boolean,
    maximum: number,
    locale: string,
    limit: number,
    quantity: number,
    notes: string,
    name: string,
    score: number,
    status: GlobalModelExceptionStatus,
  ) {
    this.code = code;
    this.title = title;
    this.currency = currency;
    this.approved = approved;
    this.maximum = maximum;
    this.locale = locale;
    this.limit = limit;
    this.quantity = quantity;
    this.notes = notes;
    this.name = name;
    this.score = score;
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

  canMoveTo(next: GlobalModelExceptionStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: GlobalModelExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global model exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"global model exception"} ${this.code}`;
  }

  effectiveLoad(): number {
    return Math.round(this.maximum * this.quantity * 100) / 100;
  }

  copy(): GlobalModelException {
    return new GlobalModelException(
      this.code,
      this.title,
      this.currency,
      this.approved,
      this.maximum,
      this.locale,
      this.limit,
      this.quantity,
      this.notes,
      this.name,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a global model exception in status proposed. */
export function newGlobalModelException(code: string, title: string): GlobalModelException {
  return new GlobalModelException(code, title, "", false, 0, "", 0, 0, "", "", 0, "proposed");
}
