import * as text from "../../../../kit/text.js";

/** Where a primary paywall baseline is in its life cycle. */
export type PrimaryPaywallBaselineStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One primary paywall baseline, with what the planners need to act on it. */
export class PrimaryPaywallBaseline {
  code: string;
  title: string;
  contactEmail: string;
  priority: number;
  capacity: number;
  threshold: number;
  status: PrimaryPaywallBaselineStatus;

  constructor(
    code: string,
    title: string,
    contactEmail: string,
    priority: number,
    capacity: number,
    threshold: number,
    status: PrimaryPaywallBaselineStatus,
  ) {
    this.code = code;
    this.title = title;
    this.contactEmail = contactEmail;
    this.priority = priority;
    this.capacity = capacity;
    this.threshold = threshold;
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

  canMoveTo(next: PrimaryPaywallBaselineStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
          case "suspended":
            return true;
        }
        return false;
      case "pending":
        return next === "closed";
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

  moveTo(next: PrimaryPaywallBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary paywall baseline ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  projectedVolume(): number {
    return Math.round(this.threshold * this.priority * 100) / 100;
  }

  copy(): PrimaryPaywallBaseline {
    return new PrimaryPaywallBaseline(
      this.code,
      this.title,
      this.contactEmail,
      this.priority,
      this.capacity,
      this.threshold,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a primary paywall baseline in status draft. */
export function newPrimaryPaywallBaseline(code: string, title: string): PrimaryPaywallBaseline {
  return new PrimaryPaywallBaseline(code, title, "", 0, 0, 0, "draft");
}
