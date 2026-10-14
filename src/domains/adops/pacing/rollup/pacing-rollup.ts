/**
 * The pacing rollup records of adops's pacing work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a pacing rollup is in its life cycle. */
export type PacingRollupStatus = "new" | "queued" | "running" | "done" | "failed";

/** One pacing rollup, with what the planners need to act on it. */
export class PacingRollup {
  code: string;
  title: string;
  windowDays: number;
  journeyId: string;
  quantity: number;
  ceiling: number;
  status: PacingRollupStatus;

  constructor(
    code: string,
    title: string,
    windowDays: number,
    journeyId: string,
    quantity: number,
    ceiling: number,
    status: PacingRollupStatus,
  ) {
    this.code = code;
    this.title = title;
    this.windowDays = windowDays;
    this.journeyId = journeyId;
    this.quantity = quantity;
    this.ceiling = ceiling;
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

  canMoveTo(next: PacingRollupStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running" || next === "done";
      case "queued":
        return next === "done";
      case "running":
        switch (next) {
          case "done":
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

  moveTo(next: PacingRollupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pacing rollup ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  adjustedValue(): number {
    return Math.round((this.quantity + this.ceiling) * 100) / 100;
  }

  copy(): PacingRollup {
    return new PacingRollup(
      this.code,
      this.title,
      this.windowDays,
      this.journeyId,
      this.quantity,
      this.ceiling,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a pacing rollup in status new. */
export function newPacingRollup(code: string, title: string): PacingRollup {
  return new PacingRollup(code, title, 0, "", 0, 0, "new");
}
