import * as text from "../../../../kit/text.js";

/** Where a seasonal insight target is in its life cycle. */
export type SeasonalInsightTargetStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One seasonal insight target, with what the planners need to act on it. */
export class SeasonalInsightTarget {
  code: string;
  label: string;
  channel: string;
  windowDays: number;
  quantity: number;
  status: SeasonalInsightTargetStatus;

  constructor(
    code: string,
    label: string,
    channel: string,
    windowDays: number,
    quantity: number,
    status: SeasonalInsightTargetStatus,
  ) {
    this.code = code;
    this.label = label;
    this.channel = channel;
    this.windowDays = windowDays;
    this.quantity = quantity;
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

  canMoveTo(next: SeasonalInsightTargetStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
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

  moveTo(next: SeasonalInsightTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal insight target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  netValue(): number {
    return Math.round((this.windowDays + this.quantity) * 100) / 100;
  }

  copy(): SeasonalInsightTarget {
    return new SeasonalInsightTarget(this.code, this.label, this.channel, this.windowDays, this.quantity, this.status);
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a seasonal insight target in status idle. */
export function newSeasonalInsightTarget(code: string, label: string): SeasonalInsightTarget {
  return new SeasonalInsightTarget(code, label, "", 0, 0, "idle");
}
