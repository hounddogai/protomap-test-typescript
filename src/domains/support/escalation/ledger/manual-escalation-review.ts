import * as text from "../../../../kit/text.js";

/** Where a manual escalation review is in its life cycle. */
export type ManualEscalationReviewStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a manual escalation review and its current status. */
export class ManualEscalationReview {
  code: string;
  title: string;
  country: string;
  sendAt: number;
  margin: number;
  externalRef: string;
  threshold: number;
  unit: string;
  status: ManualEscalationReviewStatus;

  constructor(
    code: string,
    title: string,
    country: string,
    sendAt: number,
    margin: number,
    externalRef: string,
    threshold: number,
    unit: string,
    status: ManualEscalationReviewStatus,
  ) {
    this.code = code;
    this.title = title;
    this.country = country;
    this.sendAt = sendAt;
    this.margin = margin;
    this.externalRef = externalRef;
    this.threshold = threshold;
    this.unit = unit;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: ManualEscalationReviewStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected";
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: ManualEscalationReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual escalation review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  adjustedExposure(): number {
    return Math.round(this.threshold * this.margin * 100) / 100;
  }

  copy(): ManualEscalationReview {
    return new ManualEscalationReview(
      this.code,
      this.title,
      this.country,
      this.sendAt,
      this.margin,
      this.externalRef,
      this.threshold,
      this.unit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a manual escalation review in status proposed. */
export function newManualEscalationReview(code: string, title: string): ManualEscalationReview {
  return new ManualEscalationReview(code, title, "", 0, 0, "", 0, "", "proposed");
}
