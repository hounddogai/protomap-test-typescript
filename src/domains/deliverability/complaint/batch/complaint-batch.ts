/**
 * The complaint batch records of deliverability's complaint work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a complaint batch is in its life cycle. */
export type ComplaintBatchStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a complaint batch and its current status. */
export class ComplaintBatch {
  code: string;
  name: string;
  label: string;
  ceiling: number;
  locale: string;
  archived: boolean;
  category: string;
  reviewer: string;
  status: ComplaintBatchStatus;

  constructor(
    code: string,
    name: string,
    label: string,
    ceiling: number,
    locale: string,
    archived: boolean,
    category: string,
    reviewer: string,
    status: ComplaintBatchStatus,
  ) {
    this.code = code;
    this.name = name;
    this.label = label;
    this.ceiling = ceiling;
    this.locale = locale;
    this.archived = archived;
    this.category = category;
    this.reviewer = reviewer;
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

  canMoveTo(next: ComplaintBatchStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "revoked";
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: ComplaintBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`complaint batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.name})`;
  }

  measuredValue(): number {
    return this.ceiling;
  }

  copy(): ComplaintBatch {
    return new ComplaintBatch(
      this.code,
      this.name,
      this.label,
      this.ceiling,
      this.locale,
      this.archived,
      this.category,
      this.reviewer,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a complaint batch in status requested. */
export function newComplaintBatch(code: string, name: string): ComplaintBatch {
  return new ComplaintBatch(code, name, "", 0, "", false, "", "", "requested");
}
