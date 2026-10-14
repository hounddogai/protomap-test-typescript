import * as text from "../../../../kit/text.js";

/** Where a lenient conversion batch is in its life cycle. */
export type LenientConversionBatchStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a lenient conversion batch and its current status. */
export class LenientConversionBatch {
  code: string;
  title: string;
  locale: string;
  country: string;
  impressions: number;
  variant: string;
  reviewer: string;
  status: LenientConversionBatchStatus;

  constructor(
    code: string,
    title: string,
    locale: string,
    country: string,
    impressions: number,
    variant: string,
    reviewer: string,
    status: LenientConversionBatchStatus,
  ) {
    this.code = code;
    this.title = title;
    this.locale = locale;
    this.country = country;
    this.impressions = impressions;
    this.variant = variant;
    this.reviewer = reviewer;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: LenientConversionBatchStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled";
      case "scheduled":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: LenientConversionBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient conversion batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  measuredValue(): number {
    return this.impressions;
  }

  copy(): LenientConversionBatch {
    return new LenientConversionBatch(
      this.code,
      this.title,
      this.locale,
      this.country,
      this.impressions,
      this.variant,
      this.reviewer,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a lenient conversion batch in status planned. */
export function newLenientConversionBatch(code: string, title: string): LenientConversionBatch {
  return new LenientConversionBatch(code, title, "", "", 0, "", "", "planned");
}
