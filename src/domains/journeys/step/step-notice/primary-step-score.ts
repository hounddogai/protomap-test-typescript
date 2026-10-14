import * as text from "../../../../kit/text.js";

/** Where a primary step score is in its life cycle. */
export type PrimaryStepScoreStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One primary step score, with what the planners need to act on it. */
export class PrimaryStepScore {
  code: string;
  label: string;
  margin: number;
  sequence: number;
  segment: string;
  amount: number;
  status: PrimaryStepScoreStatus;

  constructor(
    code: string,
    label: string,
    margin: number,
    sequence: number,
    segment: string,
    amount: number,
    status: PrimaryStepScoreStatus,
  ) {
    this.code = code;
    this.label = label;
    this.margin = margin;
    this.sequence = sequence;
    this.segment = segment;
    this.amount = amount;
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

  canMoveTo(next: PrimaryStepScoreStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "resolved" || next === "archived";
      case "in_review":
        switch (next) {
          case "resolved":
          case "reopened":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: PrimaryStepScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary step score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  effectiveTotal(): number {
    return Math.round(this.amount * this.margin * 100) / 100;
  }

  copy(): PrimaryStepScore {
    return new PrimaryStepScore(
      this.code,
      this.label,
      this.margin,
      this.sequence,
      this.segment,
      this.amount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a primary step score in status open. */
export function newPrimaryStepScore(code: string, label: string): PrimaryStepScore {
  return new PrimaryStepScore(code, label, 0, 0, "", 0, "open");
}
