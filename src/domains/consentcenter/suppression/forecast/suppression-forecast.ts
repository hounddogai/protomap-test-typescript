/**
 * The suppression forecast records of consentcenter's suppression work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a suppression forecast is in its life cycle. */
export type SuppressionForecastStatus = "created" | "validated" | "published" | "retired";

/** A suppression forecast. Its code is unique within a tenant. */
export class SuppressionForecast {
  code: string;
  title: string;
  sequence: number;
  reviewer: string;
  category: string;
  ratio: number;
  pinned: boolean;
  status: SuppressionForecastStatus;

  constructor(
    code: string,
    title: string,
    sequence: number,
    reviewer: string,
    category: string,
    ratio: number,
    pinned: boolean,
    status: SuppressionForecastStatus,
  ) {
    this.code = code;
    this.title = title;
    this.sequence = sequence;
    this.reviewer = reviewer;
    this.category = category;
    this.ratio = ratio;
    this.pinned = pinned;
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

  canMoveTo(next: SuppressionForecastStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated" || next === "published";
      case "validated":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SuppressionForecastStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`suppression forecast ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"suppression forecast"} ${this.code}`;
  }

  weightedVolume(): number {
    return Math.round((this.ratio - this.sequence) * 100) / 100;
  }

  copy(): SuppressionForecast {
    return new SuppressionForecast(
      this.code,
      this.title,
      this.sequence,
      this.reviewer,
      this.category,
      this.ratio,
      this.pinned,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a suppression forecast in status created. */
export function newSuppressionForecast(code: string, title: string): SuppressionForecast {
  return new SuppressionForecast(code, title, 0, "", "", 0, false, "created");
}
