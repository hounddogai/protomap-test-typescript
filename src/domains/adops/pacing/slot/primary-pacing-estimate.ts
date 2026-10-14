import * as text from "../../../../kit/text.js";

/** Where a primary pacing estimate is in its life cycle. */
export type PrimaryPacingEstimateStatus = "created" | "validated" | "published" | "retired";

/** A primary pacing estimate. Its code is unique within a tenant. */
export class PrimaryPacingEstimate {
  code: string;
  title: string;
  impressions: number;
  threshold: number;
  ceiling: number;
  status: PrimaryPacingEstimateStatus;

  constructor(
    code: string,
    title: string,
    impressions: number,
    threshold: number,
    ceiling: number,
    status: PrimaryPacingEstimateStatus,
  ) {
    this.code = code;
    this.title = title;
    this.impressions = impressions;
    this.threshold = threshold;
    this.ceiling = ceiling;
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

  canMoveTo(next: PrimaryPacingEstimateStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PrimaryPacingEstimateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary pacing estimate ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  weightedValue(): number {
    return Math.round(this.impressions * this.ceiling * 100) / 100;
  }

  copy(): PrimaryPacingEstimate {
    return new PrimaryPacingEstimate(
      this.code,
      this.title,
      this.impressions,
      this.threshold,
      this.ceiling,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a primary pacing estimate in status created. */
export function newPrimaryPacingEstimate(code: string, title: string): PrimaryPacingEstimate {
  return new PrimaryPacingEstimate(code, title, 0, 0, 0, "created");
}
