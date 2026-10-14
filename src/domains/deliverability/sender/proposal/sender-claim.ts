import * as text from "../../../../kit/text.js";

/** Where a sender claim is in its life cycle. */
export type SenderClaimStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A sender claim. Its code is unique within a tenant. */
export class SenderClaim {
  code: string;
  title: string;
  attempts: number;
  phone: string;
  maximum: number;
  pinned: boolean;
  status: SenderClaimStatus;

  constructor(
    code: string,
    title: string,
    attempts: number,
    phone: string,
    maximum: number,
    pinned: boolean,
    status: SenderClaimStatus,
  ) {
    this.code = code;
    this.title = title;
    this.attempts = attempts;
    this.phone = phone;
    this.maximum = maximum;
    this.pinned = pinned;
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

  canMoveTo(next: SenderClaimStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "suspended" || next === "closed";
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
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SenderClaimStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`sender claim ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  weightedLoad(): number {
    return Math.round((this.maximum + this.attempts) * 100) / 100;
  }

  copy(): SenderClaim {
    return new SenderClaim(this.code, this.title, this.attempts, this.phone, this.maximum, this.pinned, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a sender claim in status draft. */
export function newSenderClaim(code: string, title: string): SenderClaim {
  return new SenderClaim(code, title, 0, "", 0, false, "draft");
}
