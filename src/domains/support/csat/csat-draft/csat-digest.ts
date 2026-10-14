import * as text from "../../../../kit/text.js";

/** Where a csat digest is in its life cycle. */
export type CsatDigestStatus = "created" | "validated" | "published" | "retired";

/** A csat digest as the csat team keeps it. */
export class CsatDigest {
  code: string;
  label: string;
  locale: string;
  budget: number;
  graceDays: number;
  startsAt: number;
  priority: number;
  segment: string;
  variant: string;
  title: string;
  status: CsatDigestStatus;

  constructor(
    code: string,
    label: string,
    locale: string,
    budget: number,
    graceDays: number,
    startsAt: number,
    priority: number,
    segment: string,
    variant: string,
    title: string,
    status: CsatDigestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.locale = locale;
    this.budget = budget;
    this.graceDays = graceDays;
    this.startsAt = startsAt;
    this.priority = priority;
    this.segment = segment;
    this.variant = variant;
    this.title = title;
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

  canMoveTo(next: CsatDigestStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "published":
            return true;
        }
        return false;
      case "validated":
        return next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: CsatDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`csat digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"csat digest"} ${this.code}`;
  }

  effectiveValue(): number {
    return Math.round((this.priority - this.budget) * 100) / 100;
  }

  copy(): CsatDigest {
    return new CsatDigest(
      this.code,
      this.label,
      this.locale,
      this.budget,
      this.graceDays,
      this.startsAt,
      this.priority,
      this.segment,
      this.variant,
      this.title,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a csat digest in status created. */
export function newCsatDigest(code: string, label: string): CsatDigest {
  return new CsatDigest(code, label, "", 0, 0, 0, 0, "", "", "", "created");
}
