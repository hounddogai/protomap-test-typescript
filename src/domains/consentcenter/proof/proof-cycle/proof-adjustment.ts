import * as text from "../../../../kit/text.js";

/** Where a proof adjustment is in its life cycle. */
export type ProofAdjustmentStatus = "new" | "queued" | "running" | "done" | "failed";

/** One proof adjustment, with what the planners need to act on it. */
export class ProofAdjustment {
  code: string;
  title: string;
  attempts: number;
  sequence: number;
  score: number;
  category: string;
  status: ProofAdjustmentStatus;

  constructor(
    code: string,
    title: string,
    attempts: number,
    sequence: number,
    score: number,
    category: string,
    status: ProofAdjustmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.attempts = attempts;
    this.sequence = sequence;
    this.score = score;
    this.category = category;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: ProofAdjustmentStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued";
      case "queued":
        switch (next) {
          case "running":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ProofAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`proof adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  weightedTotal(): number {
    return Math.round((this.score + this.sequence) * 100) / 100;
  }

  copy(): ProofAdjustment {
    return new ProofAdjustment(
      this.code,
      this.title,
      this.attempts,
      this.sequence,
      this.score,
      this.category,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a proof adjustment in status new. */
export function newProofAdjustment(code: string, title: string): ProofAdjustment {
  return new ProofAdjustment(code, title, 0, 0, 0, "", "new");
}
