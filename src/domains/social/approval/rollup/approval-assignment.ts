import * as text from "../../../../kit/text.js";

/** Where a approval assignment is in its life cycle. */
export type ApprovalAssignmentStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a approval assignment and its current status. */
export class ApprovalAssignment {
  code: string;
  title: string;
  region: string;
  retries: number;
  locale: string;
  updatedAt: number;
  attributes: Map<string, string>;
  country: string;
  limit: number;
  conversionRate: number;
  status: ApprovalAssignmentStatus;

  constructor(
    code: string,
    title: string,
    region: string,
    retries: number,
    locale: string,
    updatedAt: number,
    attributes: Map<string, string>,
    country: string,
    limit: number,
    conversionRate: number,
    status: ApprovalAssignmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.region = region;
    this.retries = retries;
    this.locale = locale;
    this.updatedAt = updatedAt;
    this.attributes = attributes;
    this.country = country;
    this.limit = limit;
    this.conversionRate = conversionRate;
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

  canMoveTo(next: ApprovalAssignmentStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "expired";
      case "granted":
        return next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ApprovalAssignmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`approval assignment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"approval assignment"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  adjustedTotal(): number {
    return Math.round((this.updatedAt + this.conversionRate) * 100) / 100;
  }

  copy(): ApprovalAssignment {
    return new ApprovalAssignment(
      this.code,
      this.title,
      this.region,
      this.retries,
      this.locale,
      this.updatedAt,
      this.attributes,
      this.country,
      this.limit,
      this.conversionRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a approval assignment in status requested. */
export function newApprovalAssignment(code: string, title: string): ApprovalAssignment {
  return new ApprovalAssignment(code, title, "", 0, "", 0, new Map<string, string>(), "", 0, 0, "requested");
}
