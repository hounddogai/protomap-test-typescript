import * as text from "../../../../kit/text.js";

/** Where a reputation claim is in its life cycle. */
export type ReputationClaimStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A reputation claim. Its code is unique within a tenant. */
export class ReputationClaim {
  code: string;
  label: string;
  rate: number;
  maximum: number;
  ratio: number;
  revision: number;
  status: ReputationClaimStatus;

  constructor(
    code: string,
    label: string,
    rate: number,
    maximum: number,
    ratio: number,
    revision: number,
    status: ReputationClaimStatus,
  ) {
    this.code = code;
    this.label = label;
    this.rate = rate;
    this.maximum = maximum;
    this.ratio = ratio;
    this.revision = revision;
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

  canMoveTo(next: ReputationClaimStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        return next === "reopened";
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

  moveTo(next: ReputationClaimStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reputation claim ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  adjustedExposure(): number {
    return Math.round((this.rate - this.revision) * 100) / 100;
  }

  copy(): ReputationClaim {
    return new ReputationClaim(this.code, this.label, this.rate, this.maximum, this.ratio, this.revision, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a reputation claim in status open. */
export function newReputationClaim(code: string, label: string): ReputationClaim {
  return new ReputationClaim(code, label, 0, 0, 0, 0, "open");
}
