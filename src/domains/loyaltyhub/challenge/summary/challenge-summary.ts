/**
 * The challenge summary records of loyaltyhub's challenge work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a challenge summary is in its life cycle. */
export type ChallengeSummaryStatus = "created" | "validated" | "published" | "retired";

/** A challenge summary as the challenge team keeps it. */
export class ChallengeSummary {
  code: string;
  title: string;
  quantity: number;
  weight: number;
  minimum: number;
  limit: number;
  status: ChallengeSummaryStatus;

  constructor(
    code: string,
    title: string,
    quantity: number,
    weight: number,
    minimum: number,
    limit: number,
    status: ChallengeSummaryStatus,
  ) {
    this.code = code;
    this.title = title;
    this.quantity = quantity;
    this.weight = weight;
    this.minimum = minimum;
    this.limit = limit;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: ChallengeSummaryStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published";
      case "validated":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: ChallengeSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`challenge summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"challenge summary"} ${this.code}`;
  }

  effectiveValue(): number {
    return Math.round(this.quantity * this.weight * 100) / 100;
  }

  copy(): ChallengeSummary {
    return new ChallengeSummary(
      this.code,
      this.title,
      this.quantity,
      this.weight,
      this.minimum,
      this.limit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a challenge summary in status created. */
export function newChallengeSummary(code: string, title: string): ChallengeSummary {
  return new ChallengeSummary(code, title, 0, 0, 0, 0, "created");
}
