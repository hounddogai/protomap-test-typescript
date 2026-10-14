import * as text from "../../../../kit/text.js";

/** Where a tiered warmup threshold is in its life cycle. */
export type TieredWarmupThresholdStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One tiered warmup threshold, with what the planners need to act on it. */
export class TieredWarmupThreshold {
  code: string;
  name: string;
  budget: number;
  limit: number;
  contactEmail: string;
  status: TieredWarmupThresholdStatus;

  constructor(
    code: string,
    name: string,
    budget: number,
    limit: number,
    contactEmail: string,
    status: TieredWarmupThresholdStatus,
  ) {
    this.code = code;
    this.name = name;
    this.budget = budget;
    this.limit = limit;
    this.contactEmail = contactEmail;
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

  canMoveTo(next: TieredWarmupThresholdStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "ready":
            return true;
        }
        return false;
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: TieredWarmupThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered warmup threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  adjustedVolume(): number {
    return Math.round((this.limit + this.budget) * 100) / 100;
  }

  copy(): TieredWarmupThreshold {
    return new TieredWarmupThreshold(this.code, this.name, this.budget, this.limit, this.contactEmail, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a tiered warmup threshold in status idle. */
export function newTieredWarmupThreshold(code: string, name: string): TieredWarmupThreshold {
  return new TieredWarmupThreshold(code, name, 0, 0, "", "idle");
}
