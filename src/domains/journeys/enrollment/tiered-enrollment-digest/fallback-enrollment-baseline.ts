import * as text from "../../../../kit/text.js";

/** Where a fallback enrollment baseline is in its life cycle. */
export type FallbackEnrollmentBaselineStatus = "created" | "validated" | "published" | "retired";

/** One fallback enrollment baseline, with what the planners need to act on it. */
export class FallbackEnrollmentBaseline {
  code: string;
  label: string;
  ceiling: number;
  active: boolean;
  category: string;
  createdAt: number;
  expiresAt: number;
  attributes: Map<string, string>;
  contactEmail: string;
  journeyId: string;
  minimum: number;
  status: FallbackEnrollmentBaselineStatus;

  constructor(
    code: string,
    label: string,
    ceiling: number,
    active: boolean,
    category: string,
    createdAt: number,
    expiresAt: number,
    attributes: Map<string, string>,
    contactEmail: string,
    journeyId: string,
    minimum: number,
    status: FallbackEnrollmentBaselineStatus,
  ) {
    this.code = code;
    this.label = label;
    this.ceiling = ceiling;
    this.active = active;
    this.category = category;
    this.createdAt = createdAt;
    this.expiresAt = expiresAt;
    this.attributes = attributes;
    this.contactEmail = contactEmail;
    this.journeyId = journeyId;
    this.minimum = minimum;
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

  canMoveTo(next: FallbackEnrollmentBaselineStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
            return true;
        }
        return false;
      case "validated":
        return next === "retired";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FallbackEnrollmentBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback enrollment baseline ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"fallback enrollment baseline"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  adjustedTotal(): number {
    return Math.round(this.createdAt * this.minimum * 100) / 100;
  }

  copy(): FallbackEnrollmentBaseline {
    return new FallbackEnrollmentBaseline(
      this.code,
      this.label,
      this.ceiling,
      this.active,
      this.category,
      this.createdAt,
      this.expiresAt,
      this.attributes,
      this.contactEmail,
      this.journeyId,
      this.minimum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a fallback enrollment baseline in status created. */
export function newFallbackEnrollmentBaseline(code: string, label: string): FallbackEnrollmentBaseline {
  return new FallbackEnrollmentBaseline(
    code,
    label,
    0,
    false,
    "",
    0,
    0,
    new Map<string, string>(),
    "",
    "",
    0,
    "created",
  );
}
