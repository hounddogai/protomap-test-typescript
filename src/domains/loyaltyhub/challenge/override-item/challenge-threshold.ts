import * as text from "../../../../kit/text.js";

/** Where a challenge threshold is in its life cycle. */
export type ChallengeThresholdStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A challenge threshold. Its code is unique within a tenant. */
export class ChallengeThreshold {
  code: string;
  name: string;
  variant: string;
  description: string;
  journeyId: string;
  contactEmail: string;
  visible: boolean;
  campaignRef: string;
  score: number;
  status: ChallengeThresholdStatus;

  constructor(
    code: string,
    name: string,
    variant: string,
    description: string,
    journeyId: string,
    contactEmail: string,
    visible: boolean,
    campaignRef: string,
    score: number,
    status: ChallengeThresholdStatus,
  ) {
    this.code = code;
    this.name = name;
    this.variant = variant;
    this.description = description;
    this.journeyId = journeyId;
    this.contactEmail = contactEmail;
    this.visible = visible;
    this.campaignRef = campaignRef;
    this.score = score;
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

  canMoveTo(next: ChallengeThresholdStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "in_progress":
          case "cancelled":
            return true;
        }
        return false;
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

  moveTo(next: ChallengeThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`challenge threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"challenge threshold"} ${this.code}`;
  }

  measuredValue(): number {
    return this.score;
  }

  copy(): ChallengeThreshold {
    return new ChallengeThreshold(
      this.code,
      this.name,
      this.variant,
      this.description,
      this.journeyId,
      this.contactEmail,
      this.visible,
      this.campaignRef,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a challenge threshold in status planned. */
export function newChallengeThreshold(code: string, name: string): ChallengeThreshold {
  return new ChallengeThreshold(code, name, "", "", "", "", false, "", 0, "planned");
}
