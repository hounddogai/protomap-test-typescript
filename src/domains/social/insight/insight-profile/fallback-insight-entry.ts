import * as text from "../../../../kit/text.js";

/** Where a fallback insight entry is in its life cycle. */
export type FallbackInsightEntryStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A fallback insight entry as the insight team keeps it. */
export class FallbackInsightEntry {
  code: string;
  title: string;
  archived: boolean;
  category: string;
  campaignRef: string;
  amount: number;
  status: FallbackInsightEntryStatus;

  constructor(
    code: string,
    title: string,
    archived: boolean,
    category: string,
    campaignRef: string,
    amount: number,
    status: FallbackInsightEntryStatus,
  ) {
    this.code = code;
    this.title = title;
    this.archived = archived;
    this.category = category;
    this.campaignRef = campaignRef;
    this.amount = amount;
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

  canMoveTo(next: FallbackInsightEntryStatus): boolean {
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
        return next === "closed";
    }
    return false;
  }

  moveTo(next: FallbackInsightEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback insight entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  measuredValue(): number {
    return this.amount;
  }

  copy(): FallbackInsightEntry {
    return new FallbackInsightEntry(
      this.code,
      this.title,
      this.archived,
      this.category,
      this.campaignRef,
      this.amount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a fallback insight entry in status draft. */
export function newFallbackInsightEntry(code: string, title: string): FallbackInsightEntry {
  return new FallbackInsightEntry(code, title, false, "", "", 0, "draft");
}
