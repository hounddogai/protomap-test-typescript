import * as text from "../../../../kit/text.js";

/** Where a wait digest is in its life cycle. */
export type WaitDigestStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A wait digest as the wait team keeps it. */
export class WaitDigest {
  code: string;
  name: string;
  durationMinutes: number;
  reviewer: string;
  locale: string;
  status: WaitDigestStatus;

  constructor(
    code: string,
    name: string,
    durationMinutes: number,
    reviewer: string,
    locale: string,
    status: WaitDigestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.durationMinutes = durationMinutes;
    this.reviewer = reviewer;
    this.locale = locale;
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

  canMoveTo(next: WaitDigestStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "suspended" || next === "closed";
      case "pending":
        return next === "suspended";
      case "active":
        return next === "suspended";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: WaitDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`wait digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  measuredValue(): number {
    return this.durationMinutes;
  }

  copy(): WaitDigest {
    return new WaitDigest(this.code, this.name, this.durationMinutes, this.reviewer, this.locale, this.status);
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a wait digest in status draft. */
export function newWaitDigest(code: string, name: string): WaitDigest {
  return new WaitDigest(code, name, 0, "", "", "draft");
}
