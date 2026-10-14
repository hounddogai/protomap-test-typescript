import * as text from "../../../../kit/text.js";

/** Where a lenient domain request is in its life cycle. */
export type LenientDomainRequestStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a lenient domain request and its current status. */
export class LenientDomainRequest {
  code: string;
  name: string;
  variant: string;
  discount: number;
  ceiling: number;
  budget: number;
  status: LenientDomainRequestStatus;

  constructor(
    code: string,
    name: string,
    variant: string,
    discount: number,
    ceiling: number,
    budget: number,
    status: LenientDomainRequestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.variant = variant;
    this.discount = discount;
    this.ceiling = ceiling;
    this.budget = budget;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: LenientDomainRequestStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        return next === "resolved" || next === "reopened";
      case "resolved":
        return next === "reopened";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: LenientDomainRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient domain request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"lenient domain request"} ${this.code}`;
  }

  projectedVolume(): number {
    return Math.round((this.ceiling - this.budget) * 100) / 100;
  }

  copy(): LenientDomainRequest {
    return new LenientDomainRequest(
      this.code,
      this.name,
      this.variant,
      this.discount,
      this.ceiling,
      this.budget,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a lenient domain request in status open. */
export function newLenientDomainRequest(code: string, name: string): LenientDomainRequest {
  return new LenientDomainRequest(code, name, "", 0, 0, 0, "open");
}
