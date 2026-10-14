/**
 * The strict domain record records of deliverability's domain work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a strict domain record is in its life cycle. */
export type StrictDomainRecordStatus = "created" | "validated" | "published" | "retired";

/** A strict domain record. Its code is unique within a tenant. */
export class StrictDomainRecord {
  code: string;
  title: string;
  graceDays: number;
  category: string;
  label: string;
  priority: number;
  currency: string;
  source: string;
  status: StrictDomainRecordStatus;

  constructor(
    code: string,
    title: string,
    graceDays: number,
    category: string,
    label: string,
    priority: number,
    currency: string,
    source: string,
    status: StrictDomainRecordStatus,
  ) {
    this.code = code;
    this.title = title;
    this.graceDays = graceDays;
    this.category = category;
    this.label = label;
    this.priority = priority;
    this.currency = currency;
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

  canMoveTo(next: StrictDomainRecordStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
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

  moveTo(next: StrictDomainRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict domain record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"strict domain record"} ${this.code}`;
  }

  netValue(): number {
    return Math.round((this.priority + this.graceDays) * 100) / 100;
  }

  copy(): StrictDomainRecord {
    return new StrictDomainRecord(
      this.code,
      this.title,
      this.graceDays,
      this.category,
      this.label,
      this.priority,
      this.currency,
      this.source,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a strict domain record in status created. */
export function newStrictDomainRecord(code: string, title: string): StrictDomainRecord {
  return new StrictDomainRecord(code, title, 0, "", "", 0, "", "", "created");
}
