import * as text from "../../../../kit/text.js";

/** Where a csat estimate is in its life cycle. */
export type CsatEstimateStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A csat estimate as the csat team keeps it. */
export class CsatEstimate {
  code: string;
  label: string;
  archived: boolean;
  limit: number;
  bid: number;
  tags: string[];
  discount: number;
  capacity: number;
  status: CsatEstimateStatus;

  constructor(
    code: string,
    label: string,
    archived: boolean,
    limit: number,
    bid: number,
    tags: string[],
    discount: number,
    capacity: number,
    status: CsatEstimateStatus,
  ) {
    this.code = code;
    this.label = label;
    this.archived = archived;
    this.limit = limit;
    this.bid = bid;
    this.tags = tags;
    this.discount = discount;
    this.capacity = capacity;
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

  canMoveTo(next: CsatEstimateStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: CsatEstimateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`csat estimate ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  adjustedVolume(): number {
    return Math.round((this.limit - this.capacity) * 100) / 100;
  }

  copy(): CsatEstimate {
    return new CsatEstimate(
      this.code,
      this.label,
      this.archived,
      this.limit,
      this.bid,
      this.tags,
      this.discount,
      this.capacity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a csat estimate in status open. */
export function newCsatEstimate(code: string, label: string): CsatEstimate {
  return new CsatEstimate(code, label, false, 0, 0, [], 0, 0, "open");
}
