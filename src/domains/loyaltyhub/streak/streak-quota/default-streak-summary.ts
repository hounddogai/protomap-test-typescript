import * as text from "../../../../kit/text.js";

/** Where a default streak summary is in its life cycle. */
export type DefaultStreakSummaryStatus = "created" | "validated" | "published" | "retired";

/** The record of a default streak summary and its current status. */
export class DefaultStreakSummary {
  code: string;
  label: string;
  archived: boolean;
  updatedAt: number;
  reviewer: string;
  locale: string;
  region: string;
  batchSize: number;
  quantity: number;
  status: DefaultStreakSummaryStatus;

  constructor(
    code: string,
    label: string,
    archived: boolean,
    updatedAt: number,
    reviewer: string,
    locale: string,
    region: string,
    batchSize: number,
    quantity: number,
    status: DefaultStreakSummaryStatus,
  ) {
    this.code = code;
    this.label = label;
    this.archived = archived;
    this.updatedAt = updatedAt;
    this.reviewer = reviewer;
    this.locale = locale;
    this.region = region;
    this.batchSize = batchSize;
    this.quantity = quantity;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: DefaultStreakSummaryStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "retired";
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: DefaultStreakSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default streak summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"default streak summary"} ${this.code}`;
  }

  netLoad(): number {
    return Math.round((this.updatedAt - this.batchSize) * 100) / 100;
  }

  copy(): DefaultStreakSummary {
    return new DefaultStreakSummary(
      this.code,
      this.label,
      this.archived,
      this.updatedAt,
      this.reviewer,
      this.locale,
      this.region,
      this.batchSize,
      this.quantity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a default streak summary in status created. */
export function newDefaultStreakSummary(code: string, label: string): DefaultStreakSummary {
  return new DefaultStreakSummary(code, label, false, 0, "", "", "", 0, 0, "created");
}
