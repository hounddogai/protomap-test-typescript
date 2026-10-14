import * as text from "../../../../kit/text.js";

/** Where a suppression exception is in its life cycle. */
export type SuppressionExceptionStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A suppression exception as the suppression team keeps it. */
export class SuppressionException {
  code: string;
  title: string;
  reviewer: string;
  tags: string[];
  unit: string;
  limit: number;
  createdAt: number;
  category: string;
  campaignRef: string;
  currency: string;
  status: SuppressionExceptionStatus;

  constructor(
    code: string,
    title: string,
    reviewer: string,
    tags: string[],
    unit: string,
    limit: number,
    createdAt: number,
    category: string,
    campaignRef: string,
    currency: string,
    status: SuppressionExceptionStatus,
  ) {
    this.code = code;
    this.title = title;
    this.reviewer = reviewer;
    this.tags = tags;
    this.unit = unit;
    this.limit = limit;
    this.createdAt = createdAt;
    this.category = category;
    this.campaignRef = campaignRef;
    this.currency = currency;
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

  canMoveTo(next: SuppressionExceptionStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
          case "suspended":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "suspended":
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
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SuppressionExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`suppression exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  effectiveLoad(): number {
    return Math.round((this.createdAt + this.limit) * 100) / 100;
  }

  copy(): SuppressionException {
    return new SuppressionException(
      this.code,
      this.title,
      this.reviewer,
      this.tags,
      this.unit,
      this.limit,
      this.createdAt,
      this.category,
      this.campaignRef,
      this.currency,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a suppression exception in status draft. */
export function newSuppressionException(code: string, title: string): SuppressionException {
  return new SuppressionException(code, title, "", [], "", 0, 0, "", "", "", "draft");
}
