import * as text from "../../../../kit/text.js";

/** Where a tier window is in its life cycle. */
export type TierWindowStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A tier window as the tier team keeps it. */
export class TierWindow {
  code: string;
  name: string;
  ceiling: number;
  approved: boolean;
  summary: string;
  expiresAt: number;
  contactEmail: string;
  createdAt: number;
  status: TierWindowStatus;

  constructor(
    code: string,
    name: string,
    ceiling: number,
    approved: boolean,
    summary: string,
    expiresAt: number,
    contactEmail: string,
    createdAt: number,
    status: TierWindowStatus,
  ) {
    this.code = code;
    this.name = name;
    this.ceiling = ceiling;
    this.approved = approved;
    this.summary = summary;
    this.expiresAt = expiresAt;
    this.contactEmail = contactEmail;
    this.createdAt = createdAt;
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

  canMoveTo(next: TierWindowStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "pending":
        return next === "suspended" || next === "closed";
      case "active":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: TierWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tier window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"tier window"} ${this.code}`;
  }

  weightedExposure(): number {
    return Math.round((this.createdAt - this.ceiling) * 100) / 100;
  }

  copy(): TierWindow {
    return new TierWindow(
      this.code,
      this.name,
      this.ceiling,
      this.approved,
      this.summary,
      this.expiresAt,
      this.contactEmail,
      this.createdAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a tier window in status draft. */
export function newTierWindow(code: string, name: string): TierWindow {
  return new TierWindow(code, name, 0, false, "", 0, "", 0, "draft");
}
