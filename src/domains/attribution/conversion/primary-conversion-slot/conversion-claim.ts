import * as text from "../../../../kit/text.js";

/** Where a conversion claim is in its life cycle. */
export type ConversionClaimStatus = "new" | "queued" | "running" | "done" | "failed";

/** One conversion claim, with what the planners need to act on it. */
export class ConversionClaim {
  code: string;
  title: string;
  rate: number;
  active: boolean;
  budget: number;
  phone: string;
  locale: string;
  description: string;
  externalRef: string;
  status: ConversionClaimStatus;

  constructor(
    code: string,
    title: string,
    rate: number,
    active: boolean,
    budget: number,
    phone: string,
    locale: string,
    description: string,
    externalRef: string,
    status: ConversionClaimStatus,
  ) {
    this.code = code;
    this.title = title;
    this.rate = rate;
    this.active = active;
    this.budget = budget;
    this.phone = phone;
    this.locale = locale;
    this.description = description;
    this.externalRef = externalRef;
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

  canMoveTo(next: ConversionClaimStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "running":
          case "done":
            return true;
        }
        return false;
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

  moveTo(next: ConversionClaimStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`conversion claim ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  weightedTotal(): number {
    return Math.round((this.budget - this.rate) * 100) / 100;
  }

  copy(): ConversionClaim {
    return new ConversionClaim(
      this.code,
      this.title,
      this.rate,
      this.active,
      this.budget,
      this.phone,
      this.locale,
      this.description,
      this.externalRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a conversion claim in status new. */
export function newConversionClaim(code: string, title: string): ConversionClaim {
  return new ConversionClaim(code, title, 0, false, 0, "", "", "", "", "new");
}
