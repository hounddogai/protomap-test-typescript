import * as text from "../../../../kit/text.js";

/** Where a fallback fraud check score is in its life cycle. */
export type FallbackFraudCheckScoreStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A fallback fraud check score as the fraud check team keeps it. */
export class FallbackFraudCheckScore {
  code: string;
  title: string;
  country: string;
  ratio: number;
  attempts: number;
  minimum: number;
  status: FallbackFraudCheckScoreStatus;

  constructor(
    code: string,
    title: string,
    country: string,
    ratio: number,
    attempts: number,
    minimum: number,
    status: FallbackFraudCheckScoreStatus,
  ) {
    this.code = code;
    this.title = title;
    this.country = country;
    this.ratio = ratio;
    this.attempts = attempts;
    this.minimum = minimum;
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

  canMoveTo(next: FallbackFraudCheckScoreStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
            return true;
        }
        return false;
      case "warming":
        return next === "draining";
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

  moveTo(next: FallbackFraudCheckScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback fraud check score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"fallback fraud check score"} ${this.code}`;
  }

  projectedLoad(): number {
    return Math.round((this.minimum - this.ratio) * 100) / 100;
  }

  copy(): FallbackFraudCheckScore {
    return new FallbackFraudCheckScore(
      this.code,
      this.title,
      this.country,
      this.ratio,
      this.attempts,
      this.minimum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a fallback fraud check score in status idle. */
export function newFallbackFraudCheckScore(code: string, title: string): FallbackFraudCheckScore {
  return new FallbackFraudCheckScore(code, title, "", 0, 0, 0, "idle");
}
