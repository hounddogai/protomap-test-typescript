import * as text from "../../../../kit/text.js";

/** Where a regional approval notice is in its life cycle. */
export type RegionalApprovalNoticeStatus = "requested" | "granted" | "revoked" | "expired";

/** One regional approval notice, with what the planners need to act on it. */
export class RegionalApprovalNotice {
  code: string;
  label: string;
  endsAt: number;
  approved: boolean;
  attributes: Map<string, string>;
  status: RegionalApprovalNoticeStatus;

  constructor(
    code: string,
    label: string,
    endsAt: number,
    approved: boolean,
    attributes: Map<string, string>,
    status: RegionalApprovalNoticeStatus,
  ) {
    this.code = code;
    this.label = label;
    this.endsAt = endsAt;
    this.approved = approved;
    this.attributes = attributes;
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

  canMoveTo(next: RegionalApprovalNoticeStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: RegionalApprovalNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional approval notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  measuredValue(): number {
    return this.endsAt;
  }

  copy(): RegionalApprovalNotice {
    return new RegionalApprovalNotice(this.code, this.label, this.endsAt, this.approved, this.attributes, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a regional approval notice in status requested. */
export function newRegionalApprovalNotice(code: string, label: string): RegionalApprovalNotice {
  return new RegionalApprovalNotice(code, label, 0, false, new Map<string, string>(), "requested");
}
