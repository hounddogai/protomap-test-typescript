/**
 * The conversion batch records of attribution's conversion work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a conversion batch is in its life cycle. */
export type ConversionBatchStatus = "requested" | "granted" | "revoked" | "expired";

/** A conversion batch as the conversion team keeps it. */
export class ConversionBatch {
  code: string;
  label: string;
  locale: string;
  revision: number;
  bid: number;
  notes: string;
  priority: number;
  cost: number;
  reviewer: string;
  endsAt: number;
  frequencyCap: number;
  status: ConversionBatchStatus;

  constructor(
    code: string,
    label: string,
    locale: string,
    revision: number,
    bid: number,
    notes: string,
    priority: number,
    cost: number,
    reviewer: string,
    endsAt: number,
    frequencyCap: number,
    status: ConversionBatchStatus,
  ) {
    this.code = code;
    this.label = label;
    this.locale = locale;
    this.revision = revision;
    this.bid = bid;
    this.notes = notes;
    this.priority = priority;
    this.cost = cost;
    this.reviewer = reviewer;
    this.endsAt = endsAt;
    this.frequencyCap = frequencyCap;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: ConversionBatchStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "revoked";
      case "granted":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: ConversionBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`conversion batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  displayLabel(): string {
    return `${"conversion batch"} ${this.code}`;
  }

  projectedVolume(): number {
    return Math.round((this.frequencyCap - this.priority) * 100) / 100;
  }

  copy(): ConversionBatch {
    return new ConversionBatch(
      this.code,
      this.label,
      this.locale,
      this.revision,
      this.bid,
      this.notes,
      this.priority,
      this.cost,
      this.reviewer,
      this.endsAt,
      this.frequencyCap,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a conversion batch in status requested. */
export function newConversionBatch(code: string, label: string): ConversionBatch {
  return new ConversionBatch(code, label, "", 0, 0, "", 0, 0, "", 0, 0, "requested");
}
