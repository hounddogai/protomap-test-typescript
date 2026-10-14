import * as text from "../../../../kit/text.js";

/** Where a fallback subscription estimate is in its life cycle. */
export type FallbackSubscriptionEstimateStatus = "new" | "queued" | "running" | "done" | "failed";

/** A fallback subscription estimate as the subscription team keeps it. */
export class FallbackSubscriptionEstimate {
  code: string;
  title: string;
  phone: string;
  discount: number;
  rate: number;
  quantity: number;
  contactEmail: string;
  sequence: number;
  checksum: string;
  category: string;
  status: FallbackSubscriptionEstimateStatus;

  constructor(
    code: string,
    title: string,
    phone: string,
    discount: number,
    rate: number,
    quantity: number,
    contactEmail: string,
    sequence: number,
    checksum: string,
    category: string,
    status: FallbackSubscriptionEstimateStatus,
  ) {
    this.code = code;
    this.title = title;
    this.phone = phone;
    this.discount = discount;
    this.rate = rate;
    this.quantity = quantity;
    this.contactEmail = contactEmail;
    this.sequence = sequence;
    this.checksum = checksum;
    this.category = category;
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

  canMoveTo(next: FallbackSubscriptionEstimateStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running" || next === "done";
      case "queued":
        switch (next) {
          case "running":
          case "failed":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: FallbackSubscriptionEstimateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback subscription estimate ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  netVolume(): number {
    return Math.round((this.discount - this.sequence) * 100) / 100;
  }

  copy(): FallbackSubscriptionEstimate {
    return new FallbackSubscriptionEstimate(
      this.code,
      this.title,
      this.phone,
      this.discount,
      this.rate,
      this.quantity,
      this.contactEmail,
      this.sequence,
      this.checksum,
      this.category,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a fallback subscription estimate in status new. */
export function newFallbackSubscriptionEstimate(code: string, title: string): FallbackSubscriptionEstimate {
  return new FallbackSubscriptionEstimate(code, title, "", 0, 0, 0, "", 0, "", "", "new");
}
