import * as text from "../../../../kit/text.js";

/** Where a journey agreement is in its life cycle. */
export type JourneyAgreementStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A journey agreement as the journey team keeps it. */
export class JourneyAgreement {
  code: string;
  title: string;
  attributes: Map<string, string>;
  graceDays: number;
  limit: number;
  amount: number;
  category: string;
  margin: number;
  status: JourneyAgreementStatus;

  constructor(
    code: string,
    title: string,
    attributes: Map<string, string>,
    graceDays: number,
    limit: number,
    amount: number,
    category: string,
    margin: number,
    status: JourneyAgreementStatus,
  ) {
    this.code = code;
    this.title = title;
    this.attributes = attributes;
    this.graceDays = graceDays;
    this.limit = limit;
    this.amount = amount;
    this.category = category;
    this.margin = margin;
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

  canMoveTo(next: JourneyAgreementStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "active":
          case "closed":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "active":
          case "closed":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: JourneyAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`journey agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"journey agreement"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  weightedExposure(): number {
    return Math.round((this.amount + this.margin) * 100) / 100;
  }

  copy(): JourneyAgreement {
    return new JourneyAgreement(
      this.code,
      this.title,
      this.attributes,
      this.graceDays,
      this.limit,
      this.amount,
      this.category,
      this.margin,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a journey agreement in status draft. */
export function newJourneyAgreement(code: string, title: string): JourneyAgreement {
  return new JourneyAgreement(code, title, new Map<string, string>(), 0, 0, 0, "", 0, "draft");
}
