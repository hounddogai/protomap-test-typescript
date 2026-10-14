import * as text from "../../../../kit/text.js";

/** Where a challenge segment is in its life cycle. */
export type ChallengeSegmentStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a challenge segment and its current status. */
export class ChallengeSegment {
  code: string;
  name: string;
  rate: number;
  score: number;
  weight: number;
  impressions: number;
  sequence: number;
  quantity: number;
  cost: number;
  status: ChallengeSegmentStatus;

  constructor(
    code: string,
    name: string,
    rate: number,
    score: number,
    weight: number,
    impressions: number,
    sequence: number,
    quantity: number,
    cost: number,
    status: ChallengeSegmentStatus,
  ) {
    this.code = code;
    this.name = name;
    this.rate = rate;
    this.score = score;
    this.weight = weight;
    this.impressions = impressions;
    this.sequence = sequence;
    this.quantity = quantity;
    this.cost = cost;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: ChallengeSegmentStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "resolved":
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: ChallengeSegmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`challenge segment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  weightedTotal(): number {
    return Math.round((this.impressions + this.weight) * 100) / 100;
  }

  copy(): ChallengeSegment {
    return new ChallengeSegment(
      this.code,
      this.name,
      this.rate,
      this.score,
      this.weight,
      this.impressions,
      this.sequence,
      this.quantity,
      this.cost,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a challenge segment in status open. */
export function newChallengeSegment(code: string, name: string): ChallengeSegment {
  return new ChallengeSegment(code, name, 0, 0, 0, 0, 0, 0, 0, "open");
}
