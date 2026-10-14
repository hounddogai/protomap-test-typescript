import * as text from "../../../../kit/text.js";

/** Where a tiered wait variance is in its life cycle. */
export type TieredWaitVarianceStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One tiered wait variance, with what the planners need to act on it. */
export class TieredWaitVariance {
  code: string;
  name: string;
  startsAt: number;
  minimum: number;
  quantity: number;
  description: string;
  status: TieredWaitVarianceStatus;

  constructor(
    code: string,
    name: string,
    startsAt: number,
    minimum: number,
    quantity: number,
    description: string,
    status: TieredWaitVarianceStatus,
  ) {
    this.code = code;
    this.name = name;
    this.startsAt = startsAt;
    this.minimum = minimum;
    this.quantity = quantity;
    this.description = description;
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

  canMoveTo(next: TieredWaitVarianceStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "stopped";
      case "warming":
        return next === "stopped";
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: TieredWaitVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered wait variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"tiered wait variance"} ${this.code}`;
  }

  netValue(): number {
    return Math.round((this.minimum - this.startsAt) * 100) / 100;
  }

  copy(): TieredWaitVariance {
    return new TieredWaitVariance(
      this.code,
      this.name,
      this.startsAt,
      this.minimum,
      this.quantity,
      this.description,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a tiered wait variance in status idle. */
export function newTieredWaitVariance(code: string, name: string): TieredWaitVariance {
  return new TieredWaitVariance(code, name, 0, 0, 0, "", "idle");
}
