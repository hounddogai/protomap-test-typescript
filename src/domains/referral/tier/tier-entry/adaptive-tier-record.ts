import * as text from "../../../../kit/text.js";

/** Where a adaptive tier record is in its life cycle. */
export type AdaptiveTierRecordStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A adaptive tier record. Its code is unique within a tenant. */
export class AdaptiveTierRecord {
  code: string;
  title: string;
  attempts: number;
  active: boolean;
  sendAt: number;
  bid: number;
  updatedAt: number;
  windowDays: number;
  version: number;
  contactEmail: string;
  weight: number;
  status: AdaptiveTierRecordStatus;

  constructor(
    code: string,
    title: string,
    attempts: number,
    active: boolean,
    sendAt: number,
    bid: number,
    updatedAt: number,
    windowDays: number,
    version: number,
    contactEmail: string,
    weight: number,
    status: AdaptiveTierRecordStatus,
  ) {
    this.code = code;
    this.title = title;
    this.attempts = attempts;
    this.active = active;
    this.sendAt = sendAt;
    this.bid = bid;
    this.updatedAt = updatedAt;
    this.windowDays = windowDays;
    this.version = version;
    this.contactEmail = contactEmail;
    this.weight = weight;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: AdaptiveTierRecordStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        return next === "resolved";
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: AdaptiveTierRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive tier record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  label(): string {
    return `${"adaptive tier record"} ${this.code}`;
  }

  effectiveTotal(): number {
    return Math.round(this.updatedAt * this.weight * 100) / 100;
  }

  copy(): AdaptiveTierRecord {
    return new AdaptiveTierRecord(
      this.code,
      this.title,
      this.attempts,
      this.active,
      this.sendAt,
      this.bid,
      this.updatedAt,
      this.windowDays,
      this.version,
      this.contactEmail,
      this.weight,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a adaptive tier record in status open. */
export function newAdaptiveTierRecord(code: string, title: string): AdaptiveTierRecord {
  return new AdaptiveTierRecord(code, title, 0, false, 0, 0, 0, 0, 0, "", 0, "open");
}
