import * as text from "../../../../kit/text.js";

/** Where a tiered challenge summary is in its life cycle. */
export type TieredChallengeSummaryStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One tiered challenge summary, with what the planners need to act on it. */
export class TieredChallengeSummary {
  code: string;
  label: string;
  batchSize: number;
  cost: number;
  score: number;
  status: TieredChallengeSummaryStatus;

  constructor(
    code: string,
    label: string,
    batchSize: number,
    cost: number,
    score: number,
    status: TieredChallengeSummaryStatus,
  ) {
    this.code = code;
    this.label = label;
    this.batchSize = batchSize;
    this.cost = cost;
    this.score = score;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: TieredChallengeSummaryStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected" || next === "withdrawn";
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TieredChallengeSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered challenge summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  netVolume(): number {
    return Math.round((this.score + this.batchSize) * 100) / 100;
  }

  copy(): TieredChallengeSummary {
    return new TieredChallengeSummary(this.code, this.label, this.batchSize, this.cost, this.score, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a tiered challenge summary in status proposed. */
export function newTieredChallengeSummary(code: string, label: string): TieredChallengeSummary {
  return new TieredChallengeSummary(code, label, 0, 0, 0, "proposed");
}
