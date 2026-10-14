/**
 * The fallback exit rule cycle records of journeys's exit rule work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a fallback exit rule cycle is in its life cycle. */
export type FallbackExitRuleCycleStatus = "new" | "queued" | "running" | "done" | "failed";

/** One fallback exit rule cycle, with what the planners need to act on it. */
export class FallbackExitRuleCycle {
  code: string;
  name: string;
  budget: number;
  score: number;
  attempts: number;
  version: number;
  category: string;
  status: FallbackExitRuleCycleStatus;

  constructor(
    code: string,
    name: string,
    budget: number,
    score: number,
    attempts: number,
    version: number,
    category: string,
    status: FallbackExitRuleCycleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.budget = budget;
    this.score = score;
    this.attempts = attempts;
    this.version = version;
    this.category = category;
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

  canMoveTo(next: FallbackExitRuleCycleStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "queued":
        return next === "running" || next === "done";
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

  moveTo(next: FallbackExitRuleCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback exit rule cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  netLoad(): number {
    return Math.round(this.score * this.budget * 100) / 100;
  }

  copy(): FallbackExitRuleCycle {
    return new FallbackExitRuleCycle(
      this.code,
      this.name,
      this.budget,
      this.score,
      this.attempts,
      this.version,
      this.category,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a fallback exit rule cycle in status new. */
export function newFallbackExitRuleCycle(code: string, name: string): FallbackExitRuleCycle {
  return new FallbackExitRuleCycle(code, name, 0, 0, 0, 0, "", "new");
}
