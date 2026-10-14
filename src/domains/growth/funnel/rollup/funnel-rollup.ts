/**
 * The funnel rollup records of growth's funnel work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a funnel rollup is in its life cycle. */
export type FunnelRollupStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One funnel rollup, with what the planners need to act on it. */
export class FunnelRollup {
  code: string;
  name: string;
  category: string;
  attempts: number;
  audienceId: string;
  status: FunnelRollupStatus;

  constructor(
    code: string,
    name: string,
    category: string,
    attempts: number,
    audienceId: string,
    status: FunnelRollupStatus,
  ) {
    this.code = code;
    this.name = name;
    this.category = category;
    this.attempts = attempts;
    this.audienceId = audienceId;
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

  canMoveTo(next: FunnelRollupStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "suspended":
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

  moveTo(next: FunnelRollupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`funnel rollup ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  measuredValue(): number {
    return this.attempts;
  }

  copy(): FunnelRollup {
    return new FunnelRollup(this.code, this.name, this.category, this.attempts, this.audienceId, this.status);
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a funnel rollup in status draft. */
export function newFunnelRollup(code: string, name: string): FunnelRollup {
  return new FunnelRollup(code, name, "", 0, "", "draft");
}
