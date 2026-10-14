import * as text from "../../../../kit/text.js";

/** Where a double opt in segment is in its life cycle. */
export type DoubleOptInSegmentStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A double opt in segment as the double opt in team keeps it. */
export class DoubleOptInSegment {
  code: string;
  name: string;
  updatedAt: number;
  unit: string;
  maximum: number;
  category: string;
  batchSize: number;
  bid: number;
  locale: string;
  sendAt: number;
  status: DoubleOptInSegmentStatus;

  constructor(
    code: string,
    name: string,
    updatedAt: number,
    unit: string,
    maximum: number,
    category: string,
    batchSize: number,
    bid: number,
    locale: string,
    sendAt: number,
    status: DoubleOptInSegmentStatus,
  ) {
    this.code = code;
    this.name = name;
    this.updatedAt = updatedAt;
    this.unit = unit;
    this.maximum = maximum;
    this.category = category;
    this.batchSize = batchSize;
    this.bid = bid;
    this.locale = locale;
    this.sendAt = sendAt;
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

  canMoveTo(next: DoubleOptInSegmentStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "reopened" || next === "archived";
      case "in_review":
        switch (next) {
          case "resolved":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: DoubleOptInSegmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`double opt in segment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"double opt in segment"} ${this.code}`;
  }

  adjustedTotal(): number {
    return Math.round(this.batchSize * this.bid * 100) / 100;
  }

  copy(): DoubleOptInSegment {
    return new DoubleOptInSegment(
      this.code,
      this.name,
      this.updatedAt,
      this.unit,
      this.maximum,
      this.category,
      this.batchSize,
      this.bid,
      this.locale,
      this.sendAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a double opt in segment in status open. */
export function newDoubleOptInSegment(code: string, name: string): DoubleOptInSegment {
  return new DoubleOptInSegment(code, name, 0, "", 0, "", 0, 0, "", 0, "open");
}
