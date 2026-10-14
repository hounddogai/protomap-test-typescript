import * as text from "../../../../kit/text.js";

/** Where a suppression override is in its life cycle. */
export type SuppressionOverrideStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A suppression override. Its code is unique within a tenant. */
export class SuppressionOverride {
  code: string;
  title: string;
  locale: string;
  reviewer: string;
  createdAt: number;
  updatedAt: number;
  segment: string;
  category: string;
  ownerId: string;
  status: SuppressionOverrideStatus;

  constructor(
    code: string,
    title: string,
    locale: string,
    reviewer: string,
    createdAt: number,
    updatedAt: number,
    segment: string,
    category: string,
    ownerId: string,
    status: SuppressionOverrideStatus,
  ) {
    this.code = code;
    this.title = title;
    this.locale = locale;
    this.reviewer = reviewer;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.segment = segment;
    this.category = category;
    this.ownerId = ownerId;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: SuppressionOverrideStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
          case "rejected":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: SuppressionOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`suppression override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"suppression override"} ${this.code}`;
  }

  netLoad(): number {
    return Math.round(this.updatedAt * this.createdAt * 100) / 100;
  }

  copy(): SuppressionOverride {
    return new SuppressionOverride(
      this.code,
      this.title,
      this.locale,
      this.reviewer,
      this.createdAt,
      this.updatedAt,
      this.segment,
      this.category,
      this.ownerId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a suppression override in status proposed. */
export function newSuppressionOverride(code: string, title: string): SuppressionOverride {
  return new SuppressionOverride(code, title, "", "", 0, 0, "", "", "", "proposed");
}
