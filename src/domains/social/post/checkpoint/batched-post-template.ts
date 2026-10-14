import * as text from "../../../../kit/text.js";

/** Where a batched post template is in its life cycle. */
export type BatchedPostTemplateStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A batched post template as the post team keeps it. */
export class BatchedPostTemplate {
  code: string;
  title: string;
  durationMinutes: number;
  externalRef: string;
  expiresAt: number;
  audienceId: string;
  label: string;
  windowDays: number;
  status: BatchedPostTemplateStatus;

  constructor(
    code: string,
    title: string,
    durationMinutes: number,
    externalRef: string,
    expiresAt: number,
    audienceId: string,
    label: string,
    windowDays: number,
    status: BatchedPostTemplateStatus,
  ) {
    this.code = code;
    this.title = title;
    this.durationMinutes = durationMinutes;
    this.externalRef = externalRef;
    this.expiresAt = expiresAt;
    this.audienceId = audienceId;
    this.label = label;
    this.windowDays = windowDays;
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

  canMoveTo(next: BatchedPostTemplateStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "completed" || next === "cancelled";
      case "scheduled":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: BatchedPostTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched post template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"batched post template"} ${this.code}`;
  }

  projectedLoad(): number {
    return Math.round((this.durationMinutes + this.windowDays) * 100) / 100;
  }

  copy(): BatchedPostTemplate {
    return new BatchedPostTemplate(
      this.code,
      this.title,
      this.durationMinutes,
      this.externalRef,
      this.expiresAt,
      this.audienceId,
      this.label,
      this.windowDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a batched post template in status planned. */
export function newBatchedPostTemplate(code: string, title: string): BatchedPostTemplate {
  return new BatchedPostTemplate(code, title, 0, "", 0, "", "", 0, "planned");
}
