import * as text from "../../../../kit/text.js";

/** Where a strict streak template is in its life cycle. */
export type StrictStreakTemplateStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One strict streak template, with what the planners need to act on it. */
export class StrictStreakTemplate {
  code: string;
  title: string;
  minimum: number;
  checksum: string;
  cohort: string;
  utmSource: string;
  weight: number;
  status: StrictStreakTemplateStatus;

  constructor(
    code: string,
    title: string,
    minimum: number,
    checksum: string,
    cohort: string,
    utmSource: string,
    weight: number,
    status: StrictStreakTemplateStatus,
  ) {
    this.code = code;
    this.title = title;
    this.minimum = minimum;
    this.checksum = checksum;
    this.cohort = cohort;
    this.utmSource = utmSource;
    this.weight = weight;
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

  canMoveTo(next: StrictStreakTemplateStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review";
      case "in_review":
        switch (next) {
          case "reopened":
          case "archived":
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
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: StrictStreakTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict streak template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  netTotal(): number {
    return Math.round(this.weight * this.minimum * 100) / 100;
  }

  copy(): StrictStreakTemplate {
    return new StrictStreakTemplate(
      this.code,
      this.title,
      this.minimum,
      this.checksum,
      this.cohort,
      this.utmSource,
      this.weight,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a strict streak template in status open. */
export function newStrictStreakTemplate(code: string, title: string): StrictStreakTemplate {
  return new StrictStreakTemplate(code, title, 0, "", "", "", 0, "open");
}
