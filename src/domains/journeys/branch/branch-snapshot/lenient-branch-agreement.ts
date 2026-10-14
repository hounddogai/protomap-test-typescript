import * as text from "../../../../kit/text.js";

/** Where a lenient branch agreement is in its life cycle. */
export type LenientBranchAgreementStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A lenient branch agreement. Its code is unique within a tenant. */
export class LenientBranchAgreement {
  code: string;
  title: string;
  bid: number;
  tags: string[];
  region: string;
  floorValue: number;
  version: number;
  phone: string;
  currency: string;
  category: string;
  status: LenientBranchAgreementStatus;

  constructor(
    code: string,
    title: string,
    bid: number,
    tags: string[],
    region: string,
    floorValue: number,
    version: number,
    phone: string,
    currency: string,
    category: string,
    status: LenientBranchAgreementStatus,
  ) {
    this.code = code;
    this.title = title;
    this.bid = bid;
    this.tags = tags;
    this.region = region;
    this.floorValue = floorValue;
    this.version = version;
    this.phone = phone;
    this.currency = currency;
    this.category = category;
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

  canMoveTo(next: LenientBranchAgreementStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LenientBranchAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient branch agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  netValue(): number {
    return Math.round((this.version + this.floorValue) * 100) / 100;
  }

  copy(): LenientBranchAgreement {
    return new LenientBranchAgreement(
      this.code,
      this.title,
      this.bid,
      this.tags,
      this.region,
      this.floorValue,
      this.version,
      this.phone,
      this.currency,
      this.category,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a lenient branch agreement in status draft. */
export function newLenientBranchAgreement(code: string, title: string): LenientBranchAgreement {
  return new LenientBranchAgreement(code, title, 0, [], "", 0, 0, "", "", "", "draft");
}
