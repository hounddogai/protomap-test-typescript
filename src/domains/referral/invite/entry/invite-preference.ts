import * as text from "../../../../kit/text.js";

/** Where a invite preference is in its life cycle. */
export type InvitePreferenceStatus = "requested" | "granted" | "revoked" | "expired";

/** A invite preference as the invite team keeps it. */
export class InvitePreference {
  code: string;
  name: string;
  bid: number;
  expiresAt: number;
  startsAt: number;
  status: InvitePreferenceStatus;

  constructor(
    code: string,
    name: string,
    bid: number,
    expiresAt: number,
    startsAt: number,
    status: InvitePreferenceStatus,
  ) {
    this.code = code;
    this.name = name;
    this.bid = bid;
    this.expiresAt = expiresAt;
    this.startsAt = startsAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: InvitePreferenceStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted";
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: InvitePreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`invite preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  adjustedExposure(): number {
    return Math.round(this.startsAt * this.bid * 100) / 100;
  }

  copy(): InvitePreference {
    return new InvitePreference(this.code, this.name, this.bid, this.expiresAt, this.startsAt, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a invite preference in status requested. */
export function newInvitePreference(code: string, name: string): InvitePreference {
  return new InvitePreference(code, name, 0, 0, 0, "requested");
}
