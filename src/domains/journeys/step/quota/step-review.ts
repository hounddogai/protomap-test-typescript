import * as text from "../../../../kit/text.js";

/** Where a step review is in its life cycle. */
export type StepReviewStatus = "new" | "queued" | "running" | "done" | "failed";

/** A step review. Its code is unique within a tenant. */
export class StepReview {
  code: string;
  label: string;
  description: string;
  variant: string;
  name: string;
  phone: string;
  openRate: number;
  updatedAt: number;
  summary: string;
  status: StepReviewStatus;

  constructor(
    code: string,
    label: string,
    description: string,
    variant: string,
    name: string,
    phone: string,
    openRate: number,
    updatedAt: number,
    summary: string,
    status: StepReviewStatus,
  ) {
    this.code = code;
    this.label = label;
    this.description = description;
    this.variant = variant;
    this.name = name;
    this.phone = phone;
    this.openRate = openRate;
    this.updatedAt = updatedAt;
    this.summary = summary;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: StepReviewStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "done" || next === "failed";
      case "queued":
        return next === "running" || next === "done";
      case "running":
        return next === "done";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: StepReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`step review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  effectiveValue(): number {
    return Math.round((this.openRate + this.updatedAt) * 100) / 100;
  }

  copy(): StepReview {
    return new StepReview(
      this.code,
      this.label,
      this.description,
      this.variant,
      this.name,
      this.phone,
      this.openRate,
      this.updatedAt,
      this.summary,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a step review in status new. */
export function newStepReview(code: string, label: string): StepReview {
  return new StepReview(code, label, "", "", "", "", 0, 0, "", "new");
}
