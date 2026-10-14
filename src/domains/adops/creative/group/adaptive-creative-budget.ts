import * as text from "../../../../kit/text.js";

/** Where a adaptive creative budget is in its life cycle. */
export type AdaptiveCreativeBudgetStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a adaptive creative budget and its current status. */
export class AdaptiveCreativeBudget {
  code: string;
  title: string;
  revision: number;
  ownerId: string;
  batchSize: number;
  pinned: boolean;
  status: AdaptiveCreativeBudgetStatus;

  constructor(
    code: string,
    title: string,
    revision: number,
    ownerId: string,
    batchSize: number,
    pinned: boolean,
    status: AdaptiveCreativeBudgetStatus,
  ) {
    this.code = code;
    this.title = title;
    this.revision = revision;
    this.ownerId = ownerId;
    this.batchSize = batchSize;
    this.pinned = pinned;
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

  canMoveTo(next: AdaptiveCreativeBudgetStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming";
      case "warming":
        return next === "ready" || next === "draining";
      case "ready":
        return next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: AdaptiveCreativeBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive creative budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${"adaptive creative budget"} ${this.code}`;
  }

  projectedLoad(): number {
    return Math.round((this.batchSize + this.revision) * 100) / 100;
  }

  copy(): AdaptiveCreativeBudget {
    return new AdaptiveCreativeBudget(
      this.code,
      this.title,
      this.revision,
      this.ownerId,
      this.batchSize,
      this.pinned,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a adaptive creative budget in status idle. */
export function newAdaptiveCreativeBudget(code: string, title: string): AdaptiveCreativeBudget {
  return new AdaptiveCreativeBudget(code, title, 0, "", 0, false, "idle");
}
