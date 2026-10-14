import * as text from "../../../../kit/text.js";

/** Where a cohort digest is in its life cycle. */
export type CohortDigestStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A cohort digest as the cohort team keeps it. */
export class CohortDigest {
  code: string;
  title: string;
  revision: number;
  timezone: string;
  margin: number;
  status: CohortDigestStatus;

  constructor(
    code: string,
    title: string,
    revision: number,
    timezone: string,
    margin: number,
    status: CohortDigestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.revision = revision;
    this.timezone = timezone;
    this.margin = margin;
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

  canMoveTo(next: CohortDigestStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "in_progress":
          case "completed":
            return true;
        }
        return false;
      case "scheduled":
        return next === "in_progress";
      case "in_progress":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: CohortDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`cohort digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${"cohort digest"} ${this.code}`;
  }

  effectiveTotal(): number {
    return Math.round((this.revision - this.margin) * 100) / 100;
  }

  copy(): CohortDigest {
    return new CohortDigest(this.code, this.title, this.revision, this.timezone, this.margin, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a cohort digest in status planned. */
export function newCohortDigest(code: string, title: string): CohortDigest {
  return new CohortDigest(code, title, 0, "", 0, "planned");
}
