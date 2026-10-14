import * as text from "../../../../kit/text.js";

/** Where a suppression segment is in its life cycle. */
export type SuppressionSegmentStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a suppression segment and its current status. */
export class SuppressionSegment {
  code: string;
  name: string;
  campaignRef: string;
  amount: number;
  locale: string;
  status: SuppressionSegmentStatus;

  constructor(
    code: string,
    name: string,
    campaignRef: string,
    amount: number,
    locale: string,
    status: SuppressionSegmentStatus,
  ) {
    this.code = code;
    this.name = name;
    this.campaignRef = campaignRef;
    this.amount = amount;
    this.locale = locale;
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

  canMoveTo(next: SuppressionSegmentStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "pending":
        return next === "active" || next === "closed";
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
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

  moveTo(next: SuppressionSegmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`suppression segment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  measuredValue(): number {
    return this.amount;
  }

  copy(): SuppressionSegment {
    return new SuppressionSegment(this.code, this.name, this.campaignRef, this.amount, this.locale, this.status);
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a suppression segment in status draft. */
export function newSuppressionSegment(code: string, name: string): SuppressionSegment {
  return new SuppressionSegment(code, name, "", 0, "", "draft");
}
