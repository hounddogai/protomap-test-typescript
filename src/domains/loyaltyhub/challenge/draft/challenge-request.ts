import * as text from "../../../../kit/text.js";

/** Where a challenge request is in its life cycle. */
export type ChallengeRequestStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A challenge request as the challenge team keeps it. */
export class ChallengeRequest {
  code: string;
  label: string;
  startsAt: number;
  score: number;
  cost: number;
  budget: number;
  sequence: number;
  ratio: number;
  description: string;
  status: ChallengeRequestStatus;

  constructor(
    code: string,
    label: string,
    startsAt: number,
    score: number,
    cost: number,
    budget: number,
    sequence: number,
    ratio: number,
    description: string,
    status: ChallengeRequestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.startsAt = startsAt;
    this.score = score;
    this.cost = cost;
    this.budget = budget;
    this.sequence = sequence;
    this.ratio = ratio;
    this.description = description;
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

  canMoveTo(next: ChallengeRequestStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "resolved" || next === "reopened";
      case "in_review":
        return next === "resolved" || next === "reopened";
      case "resolved":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: ChallengeRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`challenge request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  projectedValue(): number {
    return Math.round((this.ratio - this.sequence) * 100) / 100;
  }

  copy(): ChallengeRequest {
    return new ChallengeRequest(
      this.code,
      this.label,
      this.startsAt,
      this.score,
      this.cost,
      this.budget,
      this.sequence,
      this.ratio,
      this.description,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a challenge request in status open. */
export function newChallengeRequest(code: string, label: string): ChallengeRequest {
  return new ChallengeRequest(code, label, 0, 0, 0, 0, 0, 0, "", "open");
}
