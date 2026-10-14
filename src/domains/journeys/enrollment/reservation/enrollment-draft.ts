import * as text from "../../../../kit/text.js";

/** Where a enrollment draft is in its life cycle. */
export type EnrollmentDraftStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One enrollment draft, with what the planners need to act on it. */
export class EnrollmentDraft {
  code: string;
  label: string;
  maximum: number;
  segment: string;
  expiresAt: number;
  status: EnrollmentDraftStatus;

  constructor(
    code: string,
    label: string,
    maximum: number,
    segment: string,
    expiresAt: number,
    status: EnrollmentDraftStatus,
  ) {
    this.code = code;
    this.label = label;
    this.maximum = maximum;
    this.segment = segment;
    this.expiresAt = expiresAt;
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

  canMoveTo(next: EnrollmentDraftStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "in_progress":
            return true;
        }
        return false;
      case "scheduled":
        return next === "completed";
      case "in_progress":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: EnrollmentDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`enrollment draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"enrollment draft"} ${this.code}`;
  }

  weightedLoad(): number {
    return Math.round(this.expiresAt * this.maximum * 100) / 100;
  }

  copy(): EnrollmentDraft {
    return new EnrollmentDraft(this.code, this.label, this.maximum, this.segment, this.expiresAt, this.status);
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a enrollment draft in status planned. */
export function newEnrollmentDraft(code: string, label: string): EnrollmentDraft {
  return new EnrollmentDraft(code, label, 0, "", 0, "planned");
}
