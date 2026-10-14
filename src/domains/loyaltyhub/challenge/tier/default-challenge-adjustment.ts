import * as text from "../../../../kit/text.js";

/** Where a default challenge adjustment is in its life cycle. */
export type DefaultChallengeAdjustmentStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a default challenge adjustment and its current status. */
export class DefaultChallengeAdjustment {
  code: string;
  name: string;
  segment: string;
  threshold: number;
  ceiling: number;
  attempts: number;
  endsAt: number;
  visible: boolean;
  category: string;
  reviewer: string;
  status: DefaultChallengeAdjustmentStatus;

  constructor(
    code: string,
    name: string,
    segment: string,
    threshold: number,
    ceiling: number,
    attempts: number,
    endsAt: number,
    visible: boolean,
    category: string,
    reviewer: string,
    status: DefaultChallengeAdjustmentStatus,
  ) {
    this.code = code;
    this.name = name;
    this.segment = segment;
    this.threshold = threshold;
    this.ceiling = ceiling;
    this.attempts = attempts;
    this.endsAt = endsAt;
    this.visible = visible;
    this.category = category;
    this.reviewer = reviewer;
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

  canMoveTo(next: DefaultChallengeAdjustmentStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "resolved" || next === "archived";
      case "in_review":
        return next === "reopened" || next === "archived";
      case "resolved":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: DefaultChallengeAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default challenge adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  projectedLoad(): number {
    return Math.round((this.ceiling + this.attempts) * 100) / 100;
  }

  copy(): DefaultChallengeAdjustment {
    return new DefaultChallengeAdjustment(
      this.code,
      this.name,
      this.segment,
      this.threshold,
      this.ceiling,
      this.attempts,
      this.endsAt,
      this.visible,
      this.category,
      this.reviewer,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a default challenge adjustment in status open. */
export function newDefaultChallengeAdjustment(code: string, name: string): DefaultChallengeAdjustment {
  return new DefaultChallengeAdjustment(code, name, "", 0, 0, 0, 0, false, "", "", "open");
}
