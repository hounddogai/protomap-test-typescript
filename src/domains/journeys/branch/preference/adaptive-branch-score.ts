import * as text from "../../../../kit/text.js";

/** Where a adaptive branch score is in its life cycle. */
export type AdaptiveBranchScoreStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One adaptive branch score, with what the planners need to act on it. */
export class AdaptiveBranchScore {
  code: string;
  title: string;
  ceiling: number;
  quantity: number;
  visible: boolean;
  status: AdaptiveBranchScoreStatus;

  constructor(
    code: string,
    title: string,
    ceiling: number,
    quantity: number,
    visible: boolean,
    status: AdaptiveBranchScoreStatus,
  ) {
    this.code = code;
    this.title = title;
    this.ceiling = ceiling;
    this.quantity = quantity;
    this.visible = visible;
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

  canMoveTo(next: AdaptiveBranchScoreStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
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
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: AdaptiveBranchScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive branch score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  effectiveExposure(): number {
    return Math.round((this.quantity - this.ceiling) * 100) / 100;
  }

  copy(): AdaptiveBranchScore {
    return new AdaptiveBranchScore(this.code, this.title, this.ceiling, this.quantity, this.visible, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a adaptive branch score in status open. */
export function newAdaptiveBranchScore(code: string, title: string): AdaptiveBranchScore {
  return new AdaptiveBranchScore(code, title, 0, 0, false, "open");
}
