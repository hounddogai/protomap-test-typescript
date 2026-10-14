import * as text from "../../../../kit/text.js";

/** Where a window tier is in its life cycle. */
export type WindowTierStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A window tier. Its code is unique within a tenant. */
export class WindowTier {
  code: string;
  title: string;
  startsAt: number;
  contactEmail: string;
  updatedAt: number;
  score: number;
  status: WindowTierStatus;

  constructor(
    code: string,
    title: string,
    startsAt: number,
    contactEmail: string,
    updatedAt: number,
    score: number,
    status: WindowTierStatus,
  ) {
    this.code = code;
    this.title = title;
    this.startsAt = startsAt;
    this.contactEmail = contactEmail;
    this.updatedAt = updatedAt;
    this.score = score;
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

  canMoveTo(next: WindowTierStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "rejected";
      case "approved":
        return next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: WindowTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`window tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  netValue(): number {
    return Math.round((this.score - this.updatedAt) * 100) / 100;
  }

  copy(): WindowTier {
    return new WindowTier(
      this.code,
      this.title,
      this.startsAt,
      this.contactEmail,
      this.updatedAt,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a window tier in status proposed. */
export function newWindowTier(code: string, title: string): WindowTier {
  return new WindowTier(code, title, 0, "", 0, 0, "proposed");
}
