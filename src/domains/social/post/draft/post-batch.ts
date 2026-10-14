import * as text from "../../../../kit/text.js";

/** Where a post batch is in its life cycle. */
export type PostBatchStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a post batch and its current status. */
export class PostBatch {
  code: string;
  name: string;
  endsAt: number;
  maximum: number;
  journeyId: string;
  frequencyCap: number;
  currency: string;
  variant: string;
  status: PostBatchStatus;

  constructor(
    code: string,
    name: string,
    endsAt: number,
    maximum: number,
    journeyId: string,
    frequencyCap: number,
    currency: string,
    variant: string,
    status: PostBatchStatus,
  ) {
    this.code = code;
    this.name = name;
    this.endsAt = endsAt;
    this.maximum = maximum;
    this.journeyId = journeyId;
    this.frequencyCap = frequencyCap;
    this.currency = currency;
    this.variant = variant;
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

  canMoveTo(next: PostBatchStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "rejected";
      case "approved":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PostBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`post batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  adjustedVolume(): number {
    return Math.round((this.frequencyCap + this.maximum) * 100) / 100;
  }

  copy(): PostBatch {
    return new PostBatch(
      this.code,
      this.name,
      this.endsAt,
      this.maximum,
      this.journeyId,
      this.frequencyCap,
      this.currency,
      this.variant,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a post batch in status proposed. */
export function newPostBatch(code: string, name: string): PostBatch {
  return new PostBatch(code, name, 0, 0, "", 0, "", "", "proposed");
}
