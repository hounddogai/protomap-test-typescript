import * as text from "../../../../kit/text.js";

/** Where a conversion score is in its life cycle. */
export type ConversionScoreStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One conversion score, with what the planners need to act on it. */
export class ConversionScore {
  code: string;
  label: string;
  campaignRef: string;
  externalRef: string;
  approved: boolean;
  segment: string;
  startsAt: number;
  budget: number;
  status: ConversionScoreStatus;

  constructor(
    code: string,
    label: string,
    campaignRef: string,
    externalRef: string,
    approved: boolean,
    segment: string,
    startsAt: number,
    budget: number,
    status: ConversionScoreStatus,
  ) {
    this.code = code;
    this.label = label;
    this.campaignRef = campaignRef;
    this.externalRef = externalRef;
    this.approved = approved;
    this.segment = segment;
    this.startsAt = startsAt;
    this.budget = budget;
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

  canMoveTo(next: ConversionScoreStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
          case "archived":
            return true;
        }
        return false;
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

  moveTo(next: ConversionScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`conversion score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  netVolume(): number {
    return Math.round(this.startsAt * this.budget * 100) / 100;
  }

  copy(): ConversionScore {
    return new ConversionScore(
      this.code,
      this.label,
      this.campaignRef,
      this.externalRef,
      this.approved,
      this.segment,
      this.startsAt,
      this.budget,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a conversion score in status open. */
export function newConversionScore(code: string, label: string): ConversionScore {
  return new ConversionScore(code, label, "", "", false, "", 0, 0, "open");
}
