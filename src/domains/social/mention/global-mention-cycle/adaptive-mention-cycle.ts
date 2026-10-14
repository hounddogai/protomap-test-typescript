/**
 * The adaptive mention cycle records of social's mention work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a adaptive mention cycle is in its life cycle. */
export type AdaptiveMentionCycleStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A adaptive mention cycle. Its code is unique within a tenant. */
export class AdaptiveMentionCycle {
  code: string;
  label: string;
  journeyId: string;
  phone: string;
  quantity: number;
  retries: number;
  bid: number;
  priority: number;
  status: AdaptiveMentionCycleStatus;

  constructor(
    code: string,
    label: string,
    journeyId: string,
    phone: string,
    quantity: number,
    retries: number,
    bid: number,
    priority: number,
    status: AdaptiveMentionCycleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.journeyId = journeyId;
    this.phone = phone;
    this.quantity = quantity;
    this.retries = retries;
    this.bid = bid;
    this.priority = priority;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: AdaptiveMentionCycleStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: AdaptiveMentionCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive mention cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  weightedExposure(): number {
    return Math.round(this.priority * this.retries * 100) / 100;
  }

  copy(): AdaptiveMentionCycle {
    return new AdaptiveMentionCycle(
      this.code,
      this.label,
      this.journeyId,
      this.phone,
      this.quantity,
      this.retries,
      this.bid,
      this.priority,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a adaptive mention cycle in status open. */
export function newAdaptiveMentionCycle(code: string, label: string): AdaptiveMentionCycle {
  return new AdaptiveMentionCycle(code, label, "", "", 0, 0, 0, 0, "open");
}
