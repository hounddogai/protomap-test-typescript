import * as text from "../../../../kit/text.js";

/** Where a lenient level threshold is in its life cycle. */
export type LenientLevelThresholdStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a lenient level threshold and its current status. */
export class LenientLevelThreshold {
  code: string;
  title: string;
  description: string;
  audienceId: string;
  cohort: string;
  locale: string;
  version: number;
  segment: string;
  budget: number;
  status: LenientLevelThresholdStatus;

  constructor(
    code: string,
    title: string,
    description: string,
    audienceId: string,
    cohort: string,
    locale: string,
    version: number,
    segment: string,
    budget: number,
    status: LenientLevelThresholdStatus,
  ) {
    this.code = code;
    this.title = title;
    this.description = description;
    this.audienceId = audienceId;
    this.cohort = cohort;
    this.locale = locale;
    this.version = version;
    this.segment = segment;
    this.budget = budget;
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

  canMoveTo(next: LenientLevelThresholdStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "active":
          case "closed":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LenientLevelThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient level threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${"lenient level threshold"} ${this.code}`;
  }

  effectiveVolume(): number {
    return Math.round((this.budget + this.version) * 100) / 100;
  }

  copy(): LenientLevelThreshold {
    return new LenientLevelThreshold(
      this.code,
      this.title,
      this.description,
      this.audienceId,
      this.cohort,
      this.locale,
      this.version,
      this.segment,
      this.budget,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a lenient level threshold in status draft. */
export function newLenientLevelThreshold(code: string, title: string): LenientLevelThreshold {
  return new LenientLevelThreshold(code, title, "", "", "", "", 0, "", 0, "draft");
}
