/**
 * The approval draft records of social's approval work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a approval draft is in its life cycle. */
export type ApprovalDraftStatus = "new" | "queued" | "running" | "done" | "failed";

/** One approval draft, with what the planners need to act on it. */
export class ApprovalDraft {
  code: string;
  title: string;
  graceDays: number;
  floorValue: number;
  amount: number;
  cost: number;
  status: ApprovalDraftStatus;

  constructor(
    code: string,
    title: string,
    graceDays: number,
    floorValue: number,
    amount: number,
    cost: number,
    status: ApprovalDraftStatus,
  ) {
    this.code = code;
    this.title = title;
    this.graceDays = graceDays;
    this.floorValue = floorValue;
    this.amount = amount;
    this.cost = cost;
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

  canMoveTo(next: ApprovalDraftStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
            return true;
        }
        return false;
      case "queued":
        return next === "done" || next === "failed";
      case "running":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: ApprovalDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`approval draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  projectedValue(): number {
    return Math.round(this.cost * this.amount * 100) / 100;
  }

  copy(): ApprovalDraft {
    return new ApprovalDraft(
      this.code,
      this.title,
      this.graceDays,
      this.floorValue,
      this.amount,
      this.cost,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a approval draft in status new. */
export function newApprovalDraft(code: string, title: string): ApprovalDraft {
  return new ApprovalDraft(code, title, 0, 0, 0, 0, "new");
}
