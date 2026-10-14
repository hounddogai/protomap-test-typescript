import * as text from "../../../../kit/text.js";

/** Where a weighted branch profile is in its life cycle. */
export type WeightedBranchProfileStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One weighted branch profile, with what the planners need to act on it. */
export class WeightedBranchProfile {
  code: string;
  title: string;
  cohort: string;
  retries: number;
  utmSource: string;
  description: string;
  sendAt: number;
  status: WeightedBranchProfileStatus;

  constructor(
    code: string,
    title: string,
    cohort: string,
    retries: number,
    utmSource: string,
    description: string,
    sendAt: number,
    status: WeightedBranchProfileStatus,
  ) {
    this.code = code;
    this.title = title;
    this.cohort = cohort;
    this.retries = retries;
    this.utmSource = utmSource;
    this.description = description;
    this.sendAt = sendAt;
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

  canMoveTo(next: WeightedBranchProfileStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
          case "rejected":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
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

  moveTo(next: WeightedBranchProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted branch profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  adjustedLoad(): number {
    return Math.round((this.sendAt - this.retries) * 100) / 100;
  }

  copy(): WeightedBranchProfile {
    return new WeightedBranchProfile(
      this.code,
      this.title,
      this.cohort,
      this.retries,
      this.utmSource,
      this.description,
      this.sendAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a weighted branch profile in status proposed. */
export function newWeightedBranchProfile(code: string, title: string): WeightedBranchProfile {
  return new WeightedBranchProfile(code, title, "", 0, "", "", 0, "proposed");
}
