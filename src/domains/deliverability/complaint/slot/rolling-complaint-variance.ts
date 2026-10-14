import * as text from "../../../../kit/text.js";

/** Where a rolling complaint variance is in its life cycle. */
export type RollingComplaintVarianceStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One rolling complaint variance, with what the planners need to act on it. */
export class RollingComplaintVariance {
  code: string;
  name: string;
  externalRef: string;
  retries: number;
  score: number;
  description: string;
  status: RollingComplaintVarianceStatus;

  constructor(
    code: string,
    name: string,
    externalRef: string,
    retries: number,
    score: number,
    description: string,
    status: RollingComplaintVarianceStatus,
  ) {
    this.code = code;
    this.name = name;
    this.externalRef = externalRef;
    this.retries = retries;
    this.score = score;
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

  canMoveTo(next: RollingComplaintVarianceStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
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
          case "reopened":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: RollingComplaintVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling complaint variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  weightedVolume(): number {
    return Math.round((this.score + this.retries) * 100) / 100;
  }

  copy(): RollingComplaintVariance {
    return new RollingComplaintVariance(
      this.code,
      this.name,
      this.externalRef,
      this.retries,
      this.score,
      this.description,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a rolling complaint variance in status open. */
export function newRollingComplaintVariance(code: string, name: string): RollingComplaintVariance {
  return new RollingComplaintVariance(code, name, "", 0, 0, "", "open");
}
