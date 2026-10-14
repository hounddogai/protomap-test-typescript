import * as text from "../../../../kit/text.js";

/** Where a default retention batch is in its life cycle. */
export type DefaultRetentionBatchStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One default retention batch, with what the planners need to act on it. */
export class DefaultRetentionBatch {
  code: string;
  label: string;
  clicks: number;
  attempts: number;
  source: string;
  endsAt: number;
  status: DefaultRetentionBatchStatus;

  constructor(
    code: string,
    label: string,
    clicks: number,
    attempts: number,
    source: string,
    endsAt: number,
    status: DefaultRetentionBatchStatus,
  ) {
    this.code = code;
    this.label = label;
    this.clicks = clicks;
    this.attempts = attempts;
    this.source = source;
    this.endsAt = endsAt;
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

  canMoveTo(next: DefaultRetentionBatchStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "completed" || next === "cancelled";
      case "scheduled":
        return next === "in_progress" || next === "completed";
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

  moveTo(next: DefaultRetentionBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default retention batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  projectedLoad(): number {
    return Math.round(this.attempts * this.endsAt * 100) / 100;
  }

  copy(): DefaultRetentionBatch {
    return new DefaultRetentionBatch(
      this.code,
      this.label,
      this.clicks,
      this.attempts,
      this.source,
      this.endsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a default retention batch in status planned. */
export function newDefaultRetentionBatch(code: string, label: string): DefaultRetentionBatch {
  return new DefaultRetentionBatch(code, label, 0, 0, "", 0, "planned");
}
