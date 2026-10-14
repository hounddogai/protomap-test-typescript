/**
 * The touchpoint bundle records of attribution's touchpoint work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a touchpoint bundle is in its life cycle. */
export type TouchpointBundleStatus = "new" | "queued" | "running" | "done" | "failed";

/** One touchpoint bundle, with what the planners need to act on it. */
export class TouchpointBundle {
  code: string;
  name: string;
  journeyId: string;
  region: string;
  budget: number;
  status: TouchpointBundleStatus;

  constructor(
    code: string,
    name: string,
    journeyId: string,
    region: string,
    budget: number,
    status: TouchpointBundleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.journeyId = journeyId;
    this.region = region;
    this.budget = budget;
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

  canMoveTo(next: TouchpointBundleStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "done";
      case "queued":
        return next === "failed";
      case "running":
        switch (next) {
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

  moveTo(next: TouchpointBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`touchpoint bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  measuredValue(): number {
    return this.budget;
  }

  copy(): TouchpointBundle {
    return new TouchpointBundle(this.code, this.name, this.journeyId, this.region, this.budget, this.status);
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a touchpoint bundle in status new. */
export function newTouchpointBundle(code: string, name: string): TouchpointBundle {
  return new TouchpointBundle(code, name, "", "", 0, "new");
}
