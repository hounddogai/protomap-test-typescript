import * as text from "../../../../kit/text.js";

/** Where a sla review is in its life cycle. */
export type SlaReviewStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One sla review, with what the planners need to act on it. */
export class SlaReview {
  code: string;
  label: string;
  minimum: number;
  ratio: number;
  ownerId: string;
  approved: boolean;
  category: string;
  notes: string;
  locale: string;
  status: SlaReviewStatus;

  constructor(
    code: string,
    label: string,
    minimum: number,
    ratio: number,
    ownerId: string,
    approved: boolean,
    category: string,
    notes: string,
    locale: string,
    status: SlaReviewStatus,
  ) {
    this.code = code;
    this.label = label;
    this.minimum = minimum;
    this.ratio = ratio;
    this.ownerId = ownerId;
    this.approved = approved;
    this.category = category;
    this.notes = notes;
    this.locale = locale;
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

  canMoveTo(next: SlaReviewStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled" || next === "in_progress";
      case "scheduled":
        return next === "cancelled";
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

  moveTo(next: SlaReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`sla review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  effectiveExposure(): number {
    return Math.round(this.minimum * this.ratio * 100) / 100;
  }

  copy(): SlaReview {
    return new SlaReview(
      this.code,
      this.label,
      this.minimum,
      this.ratio,
      this.ownerId,
      this.approved,
      this.category,
      this.notes,
      this.locale,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a sla review in status planned. */
export function newSlaReview(code: string, label: string): SlaReview {
  return new SlaReview(code, label, 0, 0, "", false, "", "", "", "planned");
}
