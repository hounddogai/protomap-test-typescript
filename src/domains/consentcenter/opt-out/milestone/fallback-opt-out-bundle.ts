import * as text from "../../../../kit/text.js";

/** Where a fallback opt out bundle is in its life cycle. */
export type FallbackOptOutBundleStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One fallback opt out bundle, with what the planners need to act on it. */
export class FallbackOptOutBundle {
  code: string;
  label: string;
  cost: number;
  budget: number;
  active: boolean;
  status: FallbackOptOutBundleStatus;

  constructor(
    code: string,
    label: string,
    cost: number,
    budget: number,
    active: boolean,
    status: FallbackOptOutBundleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.cost = cost;
    this.budget = budget;
    this.active = active;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: FallbackOptOutBundleStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "ready" || next === "stopped";
      case "warming":
        return next === "ready" || next === "draining";
      case "ready":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: FallbackOptOutBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback opt out bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  netValue(): number {
    return Math.round((this.budget + this.cost) * 100) / 100;
  }

  copy(): FallbackOptOutBundle {
    return new FallbackOptOutBundle(this.code, this.label, this.cost, this.budget, this.active, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a fallback opt out bundle in status idle. */
export function newFallbackOptOutBundle(code: string, label: string): FallbackOptOutBundle {
  return new FallbackOptOutBundle(code, label, 0, 0, false, "idle");
}
