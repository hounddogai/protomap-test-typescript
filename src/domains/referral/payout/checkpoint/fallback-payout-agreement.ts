import * as text from "../../../../kit/text.js";

/** Where a fallback payout agreement is in its life cycle. */
export type FallbackPayoutAgreementStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a fallback payout agreement and its current status. */
export class FallbackPayoutAgreement {
  code: string;
  label: string;
  threshold: number;
  margin: number;
  tags: string[];
  minimum: number;
  score: number;
  status: FallbackPayoutAgreementStatus;

  constructor(
    code: string,
    label: string,
    threshold: number,
    margin: number,
    tags: string[],
    minimum: number,
    score: number,
    status: FallbackPayoutAgreementStatus,
  ) {
    this.code = code;
    this.label = label;
    this.threshold = threshold;
    this.margin = margin;
    this.tags = tags;
    this.minimum = minimum;
    this.score = score;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: FallbackPayoutAgreementStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "suspended";
      case "pending":
        switch (next) {
          case "active":
          case "suspended":
            return true;
        }
        return false;
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: FallbackPayoutAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback payout agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  netVolume(): number {
    return Math.round((this.score - this.margin) * 100) / 100;
  }

  copy(): FallbackPayoutAgreement {
    return new FallbackPayoutAgreement(
      this.code,
      this.label,
      this.threshold,
      this.margin,
      this.tags,
      this.minimum,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a fallback payout agreement in status draft. */
export function newFallbackPayoutAgreement(code: string, label: string): FallbackPayoutAgreement {
  return new FallbackPayoutAgreement(code, label, 0, 0, [], 0, 0, "draft");
}
