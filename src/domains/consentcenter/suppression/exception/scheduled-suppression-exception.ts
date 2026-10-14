/**
 * The scheduled suppression exception records of consentcenter's suppression work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a scheduled suppression exception is in its life cycle. */
export type ScheduledSuppressionExceptionStatus = "created" | "validated" | "published" | "retired";

/** A scheduled suppression exception as the suppression team keeps it. */
export class ScheduledSuppressionException {
  code: string;
  name: string;
  margin: number;
  currency: string;
  journeyId: string;
  source: string;
  status: ScheduledSuppressionExceptionStatus;

  constructor(
    code: string,
    name: string,
    margin: number,
    currency: string,
    journeyId: string,
    source: string,
    status: ScheduledSuppressionExceptionStatus,
  ) {
    this.code = code;
    this.name = name;
    this.margin = margin;
    this.currency = currency;
    this.journeyId = journeyId;
    this.source = source;
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

  canMoveTo(next: ScheduledSuppressionExceptionStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published";
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: ScheduledSuppressionExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled suppression exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"scheduled suppression exception"} ${this.code}`;
  }

  measuredValue(): number {
    return this.margin;
  }

  copy(): ScheduledSuppressionException {
    return new ScheduledSuppressionException(
      this.code,
      this.name,
      this.margin,
      this.currency,
      this.journeyId,
      this.source,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a scheduled suppression exception in status created. */
export function newScheduledSuppressionException(code: string, name: string): ScheduledSuppressionException {
  return new ScheduledSuppressionException(code, name, 0, "", "", "", "created");
}
