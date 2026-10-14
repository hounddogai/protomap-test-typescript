import * as text from "../../../../kit/text.js";

/** Where a batched journey template is in its life cycle. */
export type BatchedJourneyTemplateStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a batched journey template and its current status. */
export class BatchedJourneyTemplate {
  code: string;
  title: string;
  weight: number;
  country: string;
  externalRef: string;
  status: BatchedJourneyTemplateStatus;

  constructor(
    code: string,
    title: string,
    weight: number,
    country: string,
    externalRef: string,
    status: BatchedJourneyTemplateStatus,
  ) {
    this.code = code;
    this.title = title;
    this.weight = weight;
    this.country = country;
    this.externalRef = externalRef;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: BatchedJourneyTemplateStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending" || next === "active";
      case "pending":
        switch (next) {
          case "active":
          case "closed":
            return true;
        }
        return false;
      case "active":
        return next === "suspended";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BatchedJourneyTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched journey template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  measuredValue(): number {
    return this.weight;
  }

  copy(): BatchedJourneyTemplate {
    return new BatchedJourneyTemplate(this.code, this.title, this.weight, this.country, this.externalRef, this.status);
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a batched journey template in status draft. */
export function newBatchedJourneyTemplate(code: string, title: string): BatchedJourneyTemplate {
  return new BatchedJourneyTemplate(code, title, 0, "", "", "draft");
}
