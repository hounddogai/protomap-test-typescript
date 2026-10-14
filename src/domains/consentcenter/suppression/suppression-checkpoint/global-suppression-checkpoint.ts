/**
 * The global suppression checkpoint records of consentcenter's suppression work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a global suppression checkpoint is in its life cycle. */
export type GlobalSuppressionCheckpointStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One global suppression checkpoint, with what the planners need to act on it. */
export class GlobalSuppressionCheckpoint {
  code: string;
  title: string;
  sendAt: number;
  discount: number;
  budget: number;
  status: GlobalSuppressionCheckpointStatus;

  constructor(
    code: string,
    title: string,
    sendAt: number,
    discount: number,
    budget: number,
    status: GlobalSuppressionCheckpointStatus,
  ) {
    this.code = code;
    this.title = title;
    this.sendAt = sendAt;
    this.discount = discount;
    this.budget = budget;
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

  canMoveTo(next: GlobalSuppressionCheckpointStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
          case "closed":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "active":
          case "closed":
            return true;
        }
        return false;
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: GlobalSuppressionCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global suppression checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  effectiveValue(): number {
    return Math.round((this.budget - this.sendAt) * 100) / 100;
  }

  copy(): GlobalSuppressionCheckpoint {
    return new GlobalSuppressionCheckpoint(this.code, this.title, this.sendAt, this.discount, this.budget, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a global suppression checkpoint in status draft. */
export function newGlobalSuppressionCheckpoint(code: string, title: string): GlobalSuppressionCheckpoint {
  return new GlobalSuppressionCheckpoint(code, title, 0, 0, 0, "draft");
}
