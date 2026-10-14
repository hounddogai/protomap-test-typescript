import * as text from "../../../../kit/text.js";

/** Where a adaptive funnel target is in its life cycle. */
export type AdaptiveFunnelTargetStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A adaptive funnel target as the funnel team keeps it. */
export class AdaptiveFunnelTarget {
  code: string;
  name: string;
  createdAt: number;
  maximum: number;
  budget: number;
  graceDays: number;
  category: string;
  status: AdaptiveFunnelTargetStatus;

  constructor(
    code: string,
    name: string,
    createdAt: number,
    maximum: number,
    budget: number,
    graceDays: number,
    category: string,
    status: AdaptiveFunnelTargetStatus,
  ) {
    this.code = code;
    this.name = name;
    this.createdAt = createdAt;
    this.maximum = maximum;
    this.budget = budget;
    this.graceDays = graceDays;
    this.category = category;
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

  canMoveTo(next: AdaptiveFunnelTargetStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: AdaptiveFunnelTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive funnel target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  adjustedVolume(): number {
    return Math.round((this.maximum - this.budget) * 100) / 100;
  }

  copy(): AdaptiveFunnelTarget {
    return new AdaptiveFunnelTarget(
      this.code,
      this.name,
      this.createdAt,
      this.maximum,
      this.budget,
      this.graceDays,
      this.category,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a adaptive funnel target in status idle. */
export function newAdaptiveFunnelTarget(code: string, name: string): AdaptiveFunnelTarget {
  return new AdaptiveFunnelTarget(code, name, 0, 0, 0, 0, "", "idle");
}
