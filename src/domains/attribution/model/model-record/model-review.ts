import * as text from "../../../../kit/text.js";

/** Where a model review is in its life cycle. */
export type ModelReviewStatus = "new" | "queued" | "running" | "done" | "failed";

/** A model review as the model team keeps it. */
export class ModelReview {
  code: string;
  name: string;
  rate: number;
  endsAt: number;
  phone: string;
  archived: boolean;
  currency: string;
  timezone: string;
  sendAt: number;
  description: string;
  source: string;
  status: ModelReviewStatus;

  constructor(
    code: string,
    name: string,
    rate: number,
    endsAt: number,
    phone: string,
    archived: boolean,
    currency: string,
    timezone: string,
    sendAt: number,
    description: string,
    source: string,
    status: ModelReviewStatus,
  ) {
    this.code = code;
    this.name = name;
    this.rate = rate;
    this.endsAt = endsAt;
    this.phone = phone;
    this.archived = archived;
    this.currency = currency;
    this.timezone = timezone;
    this.sendAt = sendAt;
    this.description = description;
    this.source = source;
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

  canMoveTo(next: ModelReviewStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "failed";
      case "queued":
        return next === "done" || next === "failed";
      case "running":
        return next === "done" || next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ModelReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`model review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  weightedTotal(): number {
    return Math.round((this.rate - this.sendAt) * 100) / 100;
  }

  copy(): ModelReview {
    return new ModelReview(
      this.code,
      this.name,
      this.rate,
      this.endsAt,
      this.phone,
      this.archived,
      this.currency,
      this.timezone,
      this.sendAt,
      this.description,
      this.source,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a model review in status new. */
export function newModelReview(code: string, name: string): ModelReview {
  return new ModelReview(code, name, 0, 0, "", false, "", "", 0, "", "", "new");
}
