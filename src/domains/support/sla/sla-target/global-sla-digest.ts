import * as text from "../../../../kit/text.js";

/** Where a global sla digest is in its life cycle. */
export type GlobalSlaDigestStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A global sla digest as the sla team keeps it. */
export class GlobalSlaDigest {
  code: string;
  title: string;
  windowDays: number;
  conversionRate: number;
  contactEmail: string;
  priority: number;
  category: string;
  pinned: boolean;
  cost: number;
  expiresAt: number;
  status: GlobalSlaDigestStatus;

  constructor(
    code: string,
    title: string,
    windowDays: number,
    conversionRate: number,
    contactEmail: string,
    priority: number,
    category: string,
    pinned: boolean,
    cost: number,
    expiresAt: number,
    status: GlobalSlaDigestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.windowDays = windowDays;
    this.conversionRate = conversionRate;
    this.contactEmail = contactEmail;
    this.priority = priority;
    this.category = category;
    this.pinned = pinned;
    this.cost = cost;
    this.expiresAt = expiresAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: GlobalSlaDigestStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: GlobalSlaDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global sla digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  adjustedExposure(): number {
    return Math.round(this.expiresAt * this.windowDays * 100) / 100;
  }

  copy(): GlobalSlaDigest {
    return new GlobalSlaDigest(
      this.code,
      this.title,
      this.windowDays,
      this.conversionRate,
      this.contactEmail,
      this.priority,
      this.category,
      this.pinned,
      this.cost,
      this.expiresAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a global sla digest in status proposed. */
export function newGlobalSlaDigest(code: string, title: string): GlobalSlaDigest {
  return new GlobalSlaDigest(code, title, 0, 0, "", 0, "", false, 0, 0, "proposed");
}
