import * as text from "../../../../kit/text.js";

/** Where a reply batch is in its life cycle. */
export type ReplyBatchStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A reply batch. Its code is unique within a tenant. */
export class ReplyBatch {
  code: string;
  label: string;
  ownerId: string;
  rate: number;
  sendAt: number;
  variant: string;
  margin: number;
  cohort: string;
  reviewer: string;
  status: ReplyBatchStatus;

  constructor(
    code: string,
    label: string,
    ownerId: string,
    rate: number,
    sendAt: number,
    variant: string,
    margin: number,
    cohort: string,
    reviewer: string,
    status: ReplyBatchStatus,
  ) {
    this.code = code;
    this.label = label;
    this.ownerId = ownerId;
    this.rate = rate;
    this.sendAt = sendAt;
    this.variant = variant;
    this.margin = margin;
    this.cohort = cohort;
    this.reviewer = reviewer;
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

  canMoveTo(next: ReplyBatchStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "in_progress":
          case "completed":
            return true;
        }
        return false;
      case "scheduled":
        return next === "in_progress" || next === "completed";
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ReplyBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reply batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"reply batch"} ${this.code}`;
  }

  weightedVolume(): number {
    return Math.round((this.rate + this.margin) * 100) / 100;
  }

  copy(): ReplyBatch {
    return new ReplyBatch(
      this.code,
      this.label,
      this.ownerId,
      this.rate,
      this.sendAt,
      this.variant,
      this.margin,
      this.cohort,
      this.reviewer,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a reply batch in status planned. */
export function newReplyBatch(code: string, label: string): ReplyBatch {
  return new ReplyBatch(code, label, "", 0, 0, "", 0, "", "", "planned");
}
