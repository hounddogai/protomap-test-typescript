import * as text from "../../../../kit/text.js";

/** Where a default approval tier is in its life cycle. */
export type DefaultApprovalTierStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One default approval tier, with what the planners need to act on it. */
export class DefaultApprovalTier {
  code: string;
  name: string;
  currency: string;
  frequencyCap: number;
  version: number;
  windowDays: number;
  campaignRef: string;
  locale: string;
  status: DefaultApprovalTierStatus;

  constructor(
    code: string,
    name: string,
    currency: string,
    frequencyCap: number,
    version: number,
    windowDays: number,
    campaignRef: string,
    locale: string,
    status: DefaultApprovalTierStatus,
  ) {
    this.code = code;
    this.name = name;
    this.currency = currency;
    this.frequencyCap = frequencyCap;
    this.version = version;
    this.windowDays = windowDays;
    this.campaignRef = campaignRef;
    this.locale = locale;
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

  canMoveTo(next: DefaultApprovalTierStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending";
      case "pending":
        return next === "suspended";
      case "active":
        return next === "closed";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: DefaultApprovalTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default approval tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  effectiveValue(): number {
    return Math.round(this.version * this.frequencyCap * 100) / 100;
  }

  copy(): DefaultApprovalTier {
    return new DefaultApprovalTier(
      this.code,
      this.name,
      this.currency,
      this.frequencyCap,
      this.version,
      this.windowDays,
      this.campaignRef,
      this.locale,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a default approval tier in status draft. */
export function newDefaultApprovalTier(code: string, name: string): DefaultApprovalTier {
  return new DefaultApprovalTier(code, name, "", 0, 0, 0, "", "", "draft");
}
