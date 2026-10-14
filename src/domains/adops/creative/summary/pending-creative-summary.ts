/**
 * The pending creative summary records of adops's creative work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a pending creative summary is in its life cycle. */
export type PendingCreativeSummaryStatus = "new" | "queued" | "running" | "done" | "failed";

/** One pending creative summary, with what the planners need to act on it. */
export class PendingCreativeSummary {
  code: string;
  name: string;
  label: string;
  title: string;
  reviewer: string;
  quantity: number;
  status: PendingCreativeSummaryStatus;

  constructor(
    code: string,
    name: string,
    label: string,
    title: string,
    reviewer: string,
    quantity: number,
    status: PendingCreativeSummaryStatus,
  ) {
    this.code = code;
    this.name = name;
    this.label = label;
    this.title = title;
    this.reviewer = reviewer;
    this.quantity = quantity;
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

  canMoveTo(next: PendingCreativeSummaryStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
          case "failed":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "running":
          case "done":
            return true;
        }
        return false;
      case "running":
        return next === "done";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PendingCreativeSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending creative summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"pending creative summary"} ${this.code}`;
  }

  measuredValue(): number {
    return this.quantity;
  }

  copy(): PendingCreativeSummary {
    return new PendingCreativeSummary(
      this.code,
      this.name,
      this.label,
      this.title,
      this.reviewer,
      this.quantity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a pending creative summary in status new. */
export function newPendingCreativeSummary(code: string, name: string): PendingCreativeSummary {
  return new PendingCreativeSummary(code, name, "", "", "", 0, "new");
}
