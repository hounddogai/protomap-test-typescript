/**
 * The fallback insight summary records of social's insight work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a fallback insight summary is in its life cycle. */
export type FallbackInsightSummaryStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a fallback insight summary and its current status. */
export class FallbackInsightSummary {
  code: string;
  label: string;
  approved: boolean;
  frequencyCap: number;
  quantity: number;
  name: string;
  description: string;
  discount: number;
  ratio: number;
  openRate: number;
  status: FallbackInsightSummaryStatus;

  constructor(
    code: string,
    label: string,
    approved: boolean,
    frequencyCap: number,
    quantity: number,
    name: string,
    description: string,
    discount: number,
    ratio: number,
    openRate: number,
    status: FallbackInsightSummaryStatus,
  ) {
    this.code = code;
    this.label = label;
    this.approved = approved;
    this.frequencyCap = frequencyCap;
    this.quantity = quantity;
    this.name = name;
    this.description = description;
    this.discount = discount;
    this.ratio = ratio;
    this.openRate = openRate;
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

  canMoveTo(next: FallbackInsightSummaryStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running" || next === "done";
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
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FallbackInsightSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback insight summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  netExposure(): number {
    return Math.round(this.quantity * this.frequencyCap * 100) / 100;
  }

  copy(): FallbackInsightSummary {
    return new FallbackInsightSummary(
      this.code,
      this.label,
      this.approved,
      this.frequencyCap,
      this.quantity,
      this.name,
      this.description,
      this.discount,
      this.ratio,
      this.openRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a fallback insight summary in status new. */
export function newFallbackInsightSummary(code: string, label: string): FallbackInsightSummary {
  return new FallbackInsightSummary(code, label, false, 0, 0, "", "", 0, 0, 0, "new");
}
