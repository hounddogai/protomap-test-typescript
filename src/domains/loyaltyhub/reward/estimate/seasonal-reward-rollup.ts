import * as text from "../../../../kit/text.js";

/** Where a seasonal reward rollup is in its life cycle. */
export type SeasonalRewardRollupStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One seasonal reward rollup, with what the planners need to act on it. */
export class SeasonalRewardRollup {
  code: string;
  label: string;
  updatedAt: number;
  batchSize: number;
  timezone: string;
  status: SeasonalRewardRollupStatus;

  constructor(
    code: string,
    label: string,
    updatedAt: number,
    batchSize: number,
    timezone: string,
    status: SeasonalRewardRollupStatus,
  ) {
    this.code = code;
    this.label = label;
    this.updatedAt = updatedAt;
    this.batchSize = batchSize;
    this.timezone = timezone;
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

  canMoveTo(next: SeasonalRewardRollupStatus): boolean {
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
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: SeasonalRewardRollupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal reward rollup ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  netTotal(): number {
    return Math.round((this.updatedAt + this.batchSize) * 100) / 100;
  }

  copy(): SeasonalRewardRollup {
    return new SeasonalRewardRollup(this.code, this.label, this.updatedAt, this.batchSize, this.timezone, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a seasonal reward rollup in status idle. */
export function newSeasonalRewardRollup(code: string, label: string): SeasonalRewardRollup {
  return new SeasonalRewardRollup(code, label, 0, 0, "", "idle");
}
