import * as text from "../../../../kit/text.js";

/** Where a domain review is in its life cycle. */
export type DomainReviewStatus = "new" | "queued" | "running" | "done" | "failed";

/** A domain review. Its code is unique within a tenant. */
export class DomainReview {
  code: string;
  name: string;
  campaignRef: string;
  locale: string;
  phone: string;
  amount: number;
  status: DomainReviewStatus;

  constructor(
    code: string,
    name: string,
    campaignRef: string,
    locale: string,
    phone: string,
    amount: number,
    status: DomainReviewStatus,
  ) {
    this.code = code;
    this.name = name;
    this.campaignRef = campaignRef;
    this.locale = locale;
    this.phone = phone;
    this.amount = amount;
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

  canMoveTo(next: DomainReviewStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "running":
          case "done":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
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
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: DomainReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`domain review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"domain review"} ${this.code}`;
  }

  measuredValue(): number {
    return this.amount;
  }

  copy(): DomainReview {
    return new DomainReview(this.code, this.name, this.campaignRef, this.locale, this.phone, this.amount, this.status);
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a domain review in status new. */
export function newDomainReview(code: string, name: string): DomainReview {
  return new DomainReview(code, name, "", "", "", 0, "new");
}
