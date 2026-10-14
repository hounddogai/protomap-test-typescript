import * as text from "../../../../kit/text.js";

/** Where a manual opt out profile is in its life cycle. */
export type ManualOptOutProfileStatus = "requested" | "granted" | "revoked" | "expired";

/** A manual opt out profile. Its code is unique within a tenant. */
export class ManualOptOutProfile {
  code: string;
  name: string;
  endsAt: number;
  tags: string[];
  contactEmail: string;
  graceDays: number;
  currency: string;
  status: ManualOptOutProfileStatus;

  constructor(
    code: string,
    name: string,
    endsAt: number,
    tags: string[],
    contactEmail: string,
    graceDays: number,
    currency: string,
    status: ManualOptOutProfileStatus,
  ) {
    this.code = code;
    this.name = name;
    this.endsAt = endsAt;
    this.tags = tags;
    this.contactEmail = contactEmail;
    this.graceDays = graceDays;
    this.currency = currency;
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

  canMoveTo(next: ManualOptOutProfileStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "revoked" || next === "expired";
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: ManualOptOutProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual opt out profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"manual opt out profile"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  projectedExposure(): number {
    return Math.round((this.endsAt - this.graceDays) * 100) / 100;
  }

  copy(): ManualOptOutProfile {
    return new ManualOptOutProfile(
      this.code,
      this.name,
      this.endsAt,
      this.tags,
      this.contactEmail,
      this.graceDays,
      this.currency,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a manual opt out profile in status requested. */
export function newManualOptOutProfile(code: string, name: string): ManualOptOutProfile {
  return new ManualOptOutProfile(code, name, 0, [], "", 0, "", "requested");
}
