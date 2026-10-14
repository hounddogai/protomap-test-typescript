import * as text from "../../../../kit/text.js";

/** Where a redemption score is in its life cycle. */
export type RedemptionScoreStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A redemption score as the redemption team keeps it. */
export class RedemptionScore {
  code: string;
  title: string;
  variant: string;
  score: number;
  attempts: number;
  externalRef: string;
  channel: string;
  ratio: number;
  minimum: number;
  frequencyCap: number;
  status: RedemptionScoreStatus;

  constructor(
    code: string,
    title: string,
    variant: string,
    score: number,
    attempts: number,
    externalRef: string,
    channel: string,
    ratio: number,
    minimum: number,
    frequencyCap: number,
    status: RedemptionScoreStatus,
  ) {
    this.code = code;
    this.title = title;
    this.variant = variant;
    this.score = score;
    this.attempts = attempts;
    this.externalRef = externalRef;
    this.channel = channel;
    this.ratio = ratio;
    this.minimum = minimum;
    this.frequencyCap = frequencyCap;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: RedemptionScoreStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "in_progress":
          case "completed":
            return true;
        }
        return false;
      case "scheduled":
        return next === "in_progress";
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RedemptionScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`redemption score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"redemption score"} ${this.code}`;
  }

  projectedLoad(): number {
    return Math.round(this.ratio * this.minimum * 100) / 100;
  }

  copy(): RedemptionScore {
    return new RedemptionScore(
      this.code,
      this.title,
      this.variant,
      this.score,
      this.attempts,
      this.externalRef,
      this.channel,
      this.ratio,
      this.minimum,
      this.frequencyCap,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a redemption score in status planned. */
export function newRedemptionScore(code: string, title: string): RedemptionScore {
  return new RedemptionScore(code, title, "", 0, 0, "", "", 0, 0, 0, "planned");
}
