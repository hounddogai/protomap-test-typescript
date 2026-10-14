import * as text from "../../../../kit/text.js";

/** Where a default warmup review is in its life cycle. */
export type DefaultWarmupReviewStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A default warmup review as the warmup team keeps it. */
export class DefaultWarmupReview {
  code: string;
  label: string;
  batchSize: number;
  contactEmail: string;
  startsAt: number;
  externalRef: string;
  rate: number;
  status: DefaultWarmupReviewStatus;

  constructor(
    code: string,
    label: string,
    batchSize: number,
    contactEmail: string,
    startsAt: number,
    externalRef: string,
    rate: number,
    status: DefaultWarmupReviewStatus,
  ) {
    this.code = code;
    this.label = label;
    this.batchSize = batchSize;
    this.contactEmail = contactEmail;
    this.startsAt = startsAt;
    this.externalRef = externalRef;
    this.rate = rate;
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

  canMoveTo(next: DefaultWarmupReviewStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress" || next === "cancelled";
      case "scheduled":
        return next === "cancelled";
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: DefaultWarmupReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default warmup review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  projectedVolume(): number {
    return Math.round((this.startsAt - this.rate) * 100) / 100;
  }

  copy(): DefaultWarmupReview {
    return new DefaultWarmupReview(
      this.code,
      this.label,
      this.batchSize,
      this.contactEmail,
      this.startsAt,
      this.externalRef,
      this.rate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a default warmup review in status planned. */
export function newDefaultWarmupReview(code: string, label: string): DefaultWarmupReview {
  return new DefaultWarmupReview(code, label, 0, "", 0, "", 0, "planned");
}
