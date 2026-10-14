import * as text from "../../../../kit/text.js";

/** Where a adaptive conversion window is in its life cycle. */
export type AdaptiveConversionWindowStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A adaptive conversion window. Its code is unique within a tenant. */
export class AdaptiveConversionWindow {
  code: string;
  name: string;
  contactEmail: string;
  locale: string;
  threshold: number;
  retries: number;
  amount: number;
  score: number;
  createdAt: number;
  description: string;
  journeyId: string;
  status: AdaptiveConversionWindowStatus;

  constructor(
    code: string,
    name: string,
    contactEmail: string,
    locale: string,
    threshold: number,
    retries: number,
    amount: number,
    score: number,
    createdAt: number,
    description: string,
    journeyId: string,
    status: AdaptiveConversionWindowStatus,
  ) {
    this.code = code;
    this.name = name;
    this.contactEmail = contactEmail;
    this.locale = locale;
    this.threshold = threshold;
    this.retries = retries;
    this.amount = amount;
    this.score = score;
    this.createdAt = createdAt;
    this.description = description;
    this.journeyId = journeyId;
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

  canMoveTo(next: AdaptiveConversionWindowStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending" || next === "suspended";
      case "pending":
        return next === "closed";
      case "active":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: AdaptiveConversionWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive conversion window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  projectedExposure(): number {
    return Math.round((this.amount - this.createdAt) * 100) / 100;
  }

  copy(): AdaptiveConversionWindow {
    return new AdaptiveConversionWindow(
      this.code,
      this.name,
      this.contactEmail,
      this.locale,
      this.threshold,
      this.retries,
      this.amount,
      this.score,
      this.createdAt,
      this.description,
      this.journeyId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a adaptive conversion window in status draft. */
export function newAdaptiveConversionWindow(code: string, name: string): AdaptiveConversionWindow {
  return new AdaptiveConversionWindow(code, name, "", "", 0, 0, 0, 0, 0, "", "", "draft");
}
