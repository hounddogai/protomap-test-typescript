import * as text from "../../../../kit/text.js";

/** Where a frequency score is in its life cycle. */
export type FrequencyScoreStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One frequency score, with what the planners need to act on it. */
export class FrequencyScore {
  code: string;
  label: string;
  maximum: number;
  audienceId: string;
  windowDays: number;
  segment: string;
  floorValue: number;
  contactEmail: string;
  status: FrequencyScoreStatus;

  constructor(
    code: string,
    label: string,
    maximum: number,
    audienceId: string,
    windowDays: number,
    segment: string,
    floorValue: number,
    contactEmail: string,
    status: FrequencyScoreStatus,
  ) {
    this.code = code;
    this.label = label;
    this.maximum = maximum;
    this.audienceId = audienceId;
    this.windowDays = windowDays;
    this.segment = segment;
    this.floorValue = floorValue;
    this.contactEmail = contactEmail;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: FrequencyScoreStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "rejected";
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FrequencyScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`frequency score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  effectiveExposure(): number {
    return Math.round((this.windowDays + this.floorValue) * 100) / 100;
  }

  copy(): FrequencyScore {
    return new FrequencyScore(
      this.code,
      this.label,
      this.maximum,
      this.audienceId,
      this.windowDays,
      this.segment,
      this.floorValue,
      this.contactEmail,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a frequency score in status proposed. */
export function newFrequencyScore(code: string, label: string): FrequencyScore {
  return new FrequencyScore(code, label, 0, "", 0, "", 0, "", "proposed");
}
