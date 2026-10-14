/**
 * The batched complaint window records of deliverability's complaint work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a batched complaint window is in its life cycle. */
export type BatchedComplaintWindowStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A batched complaint window. Its code is unique within a tenant. */
export class BatchedComplaintWindow {
  code: string;
  title: string;
  variant: string;
  impressions: number;
  unit: string;
  locale: string;
  name: string;
  journeyId: string;
  summary: string;
  status: BatchedComplaintWindowStatus;

  constructor(
    code: string,
    title: string,
    variant: string,
    impressions: number,
    unit: string,
    locale: string,
    name: string,
    journeyId: string,
    summary: string,
    status: BatchedComplaintWindowStatus,
  ) {
    this.code = code;
    this.title = title;
    this.variant = variant;
    this.impressions = impressions;
    this.unit = unit;
    this.locale = locale;
    this.name = name;
    this.journeyId = journeyId;
    this.summary = summary;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: BatchedComplaintWindowStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "active":
          case "closed":
            return true;
        }
        return false;
      case "pending":
        return next === "active" || next === "suspended";
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BatchedComplaintWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched complaint window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"batched complaint window"} ${this.code}`;
  }

  measuredValue(): number {
    return this.impressions;
  }

  copy(): BatchedComplaintWindow {
    return new BatchedComplaintWindow(
      this.code,
      this.title,
      this.variant,
      this.impressions,
      this.unit,
      this.locale,
      this.name,
      this.journeyId,
      this.summary,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a batched complaint window in status draft. */
export function newBatchedComplaintWindow(code: string, title: string): BatchedComplaintWindow {
  return new BatchedComplaintWindow(code, title, "", 0, "", "", "", "", "", "draft");
}
