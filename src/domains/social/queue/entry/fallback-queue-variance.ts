import * as text from "../../../../kit/text.js";

/** Where a fallback queue variance is in its life cycle. */
export type FallbackQueueVarianceStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A fallback queue variance as the queue team keeps it. */
export class FallbackQueueVariance {
  code: string;
  label: string;
  margin: number;
  cohort: string;
  clicks: number;
  description: string;
  locale: string;
  contactEmail: string;
  ceiling: number;
  status: FallbackQueueVarianceStatus;

  constructor(
    code: string,
    label: string,
    margin: number,
    cohort: string,
    clicks: number,
    description: string,
    locale: string,
    contactEmail: string,
    ceiling: number,
    status: FallbackQueueVarianceStatus,
  ) {
    this.code = code;
    this.label = label;
    this.margin = margin;
    this.cohort = cohort;
    this.clicks = clicks;
    this.description = description;
    this.locale = locale;
    this.contactEmail = contactEmail;
    this.ceiling = ceiling;
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

  canMoveTo(next: FallbackQueueVarianceStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "active" || next === "suspended";
      case "pending":
        return next === "closed";
      case "active":
        switch (next) {
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

  moveTo(next: FallbackQueueVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback queue variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  adjustedValue(): number {
    return Math.round((this.margin + this.clicks) * 100) / 100;
  }

  copy(): FallbackQueueVariance {
    return new FallbackQueueVariance(
      this.code,
      this.label,
      this.margin,
      this.cohort,
      this.clicks,
      this.description,
      this.locale,
      this.contactEmail,
      this.ceiling,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a fallback queue variance in status draft. */
export function newFallbackQueueVariance(code: string, label: string): FallbackQueueVariance {
  return new FallbackQueueVariance(code, label, 0, "", 0, "", "", "", 0, "draft");
}
