import * as text from "../../../../kit/text.js";

/** Where a invite exception is in its life cycle. */
export type InviteExceptionStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a invite exception and its current status. */
export class InviteException {
  code: string;
  name: string;
  capacity: number;
  expiresAt: number;
  createdAt: number;
  campaignRef: string;
  limit: number;
  score: number;
  description: string;
  status: InviteExceptionStatus;

  constructor(
    code: string,
    name: string,
    capacity: number,
    expiresAt: number,
    createdAt: number,
    campaignRef: string,
    limit: number,
    score: number,
    description: string,
    status: InviteExceptionStatus,
  ) {
    this.code = code;
    this.name = name;
    this.capacity = capacity;
    this.expiresAt = expiresAt;
    this.createdAt = createdAt;
    this.campaignRef = campaignRef;
    this.limit = limit;
    this.score = score;
    this.description = description;
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

  canMoveTo(next: InviteExceptionStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "suspended";
      case "pending":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "active":
        return next === "suspended";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: InviteExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`invite exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  adjustedValue(): number {
    return Math.round(this.score * this.createdAt * 100) / 100;
  }

  copy(): InviteException {
    return new InviteException(
      this.code,
      this.name,
      this.capacity,
      this.expiresAt,
      this.createdAt,
      this.campaignRef,
      this.limit,
      this.score,
      this.description,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a invite exception in status draft. */
export function newInviteException(code: string, name: string): InviteException {
  return new InviteException(code, name, 0, 0, 0, "", 0, 0, "", "draft");
}
