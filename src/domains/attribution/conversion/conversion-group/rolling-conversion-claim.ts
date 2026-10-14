import * as text from "../../../../kit/text.js";

/** Where a rolling conversion claim is in its life cycle. */
export type RollingConversionClaimStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One rolling conversion claim, with what the planners need to act on it. */
export class RollingConversionClaim {
  code: string;
  label: string;
  title: string;
  priority: number;
  createdAt: number;
  contactEmail: string;
  pinned: boolean;
  name: string;
  phone: string;
  rate: number;
  channel: string;
  status: RollingConversionClaimStatus;

  constructor(
    code: string,
    label: string,
    title: string,
    priority: number,
    createdAt: number,
    contactEmail: string,
    pinned: boolean,
    name: string,
    phone: string,
    rate: number,
    channel: string,
    status: RollingConversionClaimStatus,
  ) {
    this.code = code;
    this.label = label;
    this.title = title;
    this.priority = priority;
    this.createdAt = createdAt;
    this.contactEmail = contactEmail;
    this.pinned = pinned;
    this.name = name;
    this.phone = phone;
    this.rate = rate;
    this.channel = channel;
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

  canMoveTo(next: RollingConversionClaimStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "pending":
        return next === "suspended" || next === "closed";
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RollingConversionClaimStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling conversion claim ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"rolling conversion claim"} ${this.code}`;
  }

  adjustedTotal(): number {
    return Math.round(this.priority * this.createdAt * 100) / 100;
  }

  copy(): RollingConversionClaim {
    return new RollingConversionClaim(
      this.code,
      this.label,
      this.title,
      this.priority,
      this.createdAt,
      this.contactEmail,
      this.pinned,
      this.name,
      this.phone,
      this.rate,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a rolling conversion claim in status draft. */
export function newRollingConversionClaim(code: string, label: string): RollingConversionClaim {
  return new RollingConversionClaim(code, label, "", 0, 0, "", false, "", "", 0, "", "draft");
}
