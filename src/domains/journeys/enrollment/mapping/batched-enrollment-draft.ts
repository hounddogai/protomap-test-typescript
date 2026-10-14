import * as text from "../../../../kit/text.js";

/** Where a batched enrollment draft is in its life cycle. */
export type BatchedEnrollmentDraftStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A batched enrollment draft. Its code is unique within a tenant. */
export class BatchedEnrollmentDraft {
  code: string;
  label: string;
  variant: string;
  pinned: boolean;
  active: boolean;
  name: string;
  locale: string;
  sendAt: number;
  journeyId: string;
  status: BatchedEnrollmentDraftStatus;

  constructor(
    code: string,
    label: string,
    variant: string,
    pinned: boolean,
    active: boolean,
    name: string,
    locale: string,
    sendAt: number,
    journeyId: string,
    status: BatchedEnrollmentDraftStatus,
  ) {
    this.code = code;
    this.label = label;
    this.variant = variant;
    this.pinned = pinned;
    this.active = active;
    this.name = name;
    this.locale = locale;
    this.sendAt = sendAt;
    this.journeyId = journeyId;
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

  canMoveTo(next: BatchedEnrollmentDraftStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "resolved":
        return next === "reopened";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BatchedEnrollmentDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched enrollment draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"batched enrollment draft"} ${this.code}`;
  }

  measuredValue(): number {
    return this.sendAt;
  }

  copy(): BatchedEnrollmentDraft {
    return new BatchedEnrollmentDraft(
      this.code,
      this.label,
      this.variant,
      this.pinned,
      this.active,
      this.name,
      this.locale,
      this.sendAt,
      this.journeyId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a batched enrollment draft in status open. */
export function newBatchedEnrollmentDraft(code: string, label: string): BatchedEnrollmentDraft {
  return new BatchedEnrollmentDraft(code, label, "", false, false, "", "", 0, "", "open");
}
