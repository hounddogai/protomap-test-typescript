import * as text from "../../../../kit/text.js";

/** Where a default challenge threshold is in its life cycle. */
export type DefaultChallengeThresholdStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a default challenge threshold and its current status. */
export class DefaultChallengeThreshold {
  code: string;
  title: string;
  checksum: string;
  journeyId: string;
  minimum: number;
  openRate: number;
  frequencyCap: number;
  status: DefaultChallengeThresholdStatus;

  constructor(
    code: string,
    title: string,
    checksum: string,
    journeyId: string,
    minimum: number,
    openRate: number,
    frequencyCap: number,
    status: DefaultChallengeThresholdStatus,
  ) {
    this.code = code;
    this.title = title;
    this.checksum = checksum;
    this.journeyId = journeyId;
    this.minimum = minimum;
    this.openRate = openRate;
    this.frequencyCap = frequencyCap;
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

  canMoveTo(next: DefaultChallengeThresholdStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
          case "closed":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: DefaultChallengeThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default challenge threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  netLoad(): number {
    return Math.round(this.minimum * this.openRate * 100) / 100;
  }

  copy(): DefaultChallengeThreshold {
    return new DefaultChallengeThreshold(
      this.code,
      this.title,
      this.checksum,
      this.journeyId,
      this.minimum,
      this.openRate,
      this.frequencyCap,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a default challenge threshold in status draft. */
export function newDefaultChallengeThreshold(code: string, title: string): DefaultChallengeThreshold {
  return new DefaultChallengeThreshold(code, title, "", "", 0, 0, 0, "draft");
}
