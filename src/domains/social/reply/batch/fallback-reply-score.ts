import * as text from "../../../../kit/text.js";

/** Where a fallback reply score is in its life cycle. */
export type FallbackReplyScoreStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A fallback reply score. Its code is unique within a tenant. */
export class FallbackReplyScore {
  code: string;
  title: string;
  startsAt: number;
  contactEmail: string;
  locale: string;
  notes: string;
  retries: number;
  unit: string;
  minimum: number;
  status: FallbackReplyScoreStatus;

  constructor(
    code: string,
    title: string,
    startsAt: number,
    contactEmail: string,
    locale: string,
    notes: string,
    retries: number,
    unit: string,
    minimum: number,
    status: FallbackReplyScoreStatus,
  ) {
    this.code = code;
    this.title = title;
    this.startsAt = startsAt;
    this.contactEmail = contactEmail;
    this.locale = locale;
    this.notes = notes;
    this.retries = retries;
    this.unit = unit;
    this.minimum = minimum;
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

  canMoveTo(next: FallbackReplyScoreStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled" || next === "cancelled";
      case "scheduled":
        return next === "completed" || next === "cancelled";
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: FallbackReplyScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback reply score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  adjustedExposure(): number {
    return Math.round(this.startsAt * this.retries * 100) / 100;
  }

  copy(): FallbackReplyScore {
    return new FallbackReplyScore(
      this.code,
      this.title,
      this.startsAt,
      this.contactEmail,
      this.locale,
      this.notes,
      this.retries,
      this.unit,
      this.minimum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a fallback reply score in status planned. */
export function newFallbackReplyScore(code: string, title: string): FallbackReplyScore {
  return new FallbackReplyScore(code, title, 0, "", "", "", 0, "", 0, "planned");
}
