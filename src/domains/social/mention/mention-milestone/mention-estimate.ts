import * as text from "../../../../kit/text.js";

/** Where a mention estimate is in its life cycle. */
export type MentionEstimateStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a mention estimate and its current status. */
export class MentionEstimate {
  code: string;
  title: string;
  phone: string;
  cohort: string;
  endsAt: number;
  ceiling: number;
  status: MentionEstimateStatus;

  constructor(
    code: string,
    title: string,
    phone: string,
    cohort: string,
    endsAt: number,
    ceiling: number,
    status: MentionEstimateStatus,
  ) {
    this.code = code;
    this.title = title;
    this.phone = phone;
    this.cohort = cohort;
    this.endsAt = endsAt;
    this.ceiling = ceiling;
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

  canMoveTo(next: MentionEstimateStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
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

  moveTo(next: MentionEstimateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`mention estimate ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  adjustedLoad(): number {
    return Math.round((this.ceiling - this.endsAt) * 100) / 100;
  }

  copy(): MentionEstimate {
    return new MentionEstimate(this.code, this.title, this.phone, this.cohort, this.endsAt, this.ceiling, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a mention estimate in status proposed. */
export function newMentionEstimate(code: string, title: string): MentionEstimate {
  return new MentionEstimate(code, title, "", "", 0, 0, "proposed");
}
