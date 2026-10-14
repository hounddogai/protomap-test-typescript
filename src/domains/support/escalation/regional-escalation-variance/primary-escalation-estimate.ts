import * as text from "../../../../kit/text.js";

/** Where a primary escalation estimate is in its life cycle. */
export type PrimaryEscalationEstimateStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One primary escalation estimate, with what the planners need to act on it. */
export class PrimaryEscalationEstimate {
  code: string;
  title: string;
  ratio: number;
  conversionRate: number;
  impressions: number;
  status: PrimaryEscalationEstimateStatus;

  constructor(
    code: string,
    title: string,
    ratio: number,
    conversionRate: number,
    impressions: number,
    status: PrimaryEscalationEstimateStatus,
  ) {
    this.code = code;
    this.title = title;
    this.ratio = ratio;
    this.conversionRate = conversionRate;
    this.impressions = impressions;
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

  canMoveTo(next: PrimaryEscalationEstimateStatus): boolean {
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

  moveTo(next: PrimaryEscalationEstimateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary escalation estimate ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  projectedExposure(): number {
    return Math.round((this.impressions + this.conversionRate) * 100) / 100;
  }

  copy(): PrimaryEscalationEstimate {
    return new PrimaryEscalationEstimate(
      this.code,
      this.title,
      this.ratio,
      this.conversionRate,
      this.impressions,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a primary escalation estimate in status open. */
export function newPrimaryEscalationEstimate(code: string, title: string): PrimaryEscalationEstimate {
  return new PrimaryEscalationEstimate(code, title, 0, 0, 0, "open");
}
