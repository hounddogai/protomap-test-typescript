import * as text from "../../../../kit/text.js";

/** Where a lenient challenge score is in its life cycle. */
export type LenientChallengeScoreStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a lenient challenge score and its current status. */
export class LenientChallengeScore {
  code: string;
  name: string;
  visible: boolean;
  phone: string;
  summary: string;
  impressions: number;
  maximum: number;
  status: LenientChallengeScoreStatus;

  constructor(
    code: string,
    name: string,
    visible: boolean,
    phone: string,
    summary: string,
    impressions: number,
    maximum: number,
    status: LenientChallengeScoreStatus,
  ) {
    this.code = code;
    this.name = name;
    this.visible = visible;
    this.phone = phone;
    this.summary = summary;
    this.impressions = impressions;
    this.maximum = maximum;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: LenientChallengeScoreStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled" || next === "in_progress";
      case "scheduled":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        return next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LenientChallengeScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient challenge score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  adjustedTotal(): number {
    return Math.round((this.impressions - this.maximum) * 100) / 100;
  }

  copy(): LenientChallengeScore {
    return new LenientChallengeScore(
      this.code,
      this.name,
      this.visible,
      this.phone,
      this.summary,
      this.impressions,
      this.maximum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a lenient challenge score in status planned. */
export function newLenientChallengeScore(code: string, name: string): LenientChallengeScore {
  return new LenientChallengeScore(code, name, false, "", "", 0, 0, "planned");
}
