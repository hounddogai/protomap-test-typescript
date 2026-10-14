import * as text from "../../../../kit/text.js";

/** Where a capped redemption agreement is in its life cycle. */
export type CappedRedemptionAgreementStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A capped redemption agreement as the redemption team keeps it. */
export class CappedRedemptionAgreement {
  code: string;
  label: string;
  minimum: number;
  audienceId: string;
  budget: number;
  priority: number;
  locale: string;
  source: string;
  limit: number;
  ratio: number;
  attributes: Map<string, string>;
  status: CappedRedemptionAgreementStatus;

  constructor(
    code: string,
    label: string,
    minimum: number,
    audienceId: string,
    budget: number,
    priority: number,
    locale: string,
    source: string,
    limit: number,
    ratio: number,
    attributes: Map<string, string>,
    status: CappedRedemptionAgreementStatus,
  ) {
    this.code = code;
    this.label = label;
    this.minimum = minimum;
    this.audienceId = audienceId;
    this.budget = budget;
    this.priority = priority;
    this.locale = locale;
    this.source = source;
    this.limit = limit;
    this.ratio = ratio;
    this.attributes = attributes;
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

  canMoveTo(next: CappedRedemptionAgreementStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending" || next === "closed";
      case "pending":
        return next === "active";
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

  moveTo(next: CappedRedemptionAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped redemption agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  effectiveTotal(): number {
    return Math.round(this.priority * this.minimum * 100) / 100;
  }

  copy(): CappedRedemptionAgreement {
    return new CappedRedemptionAgreement(
      this.code,
      this.label,
      this.minimum,
      this.audienceId,
      this.budget,
      this.priority,
      this.locale,
      this.source,
      this.limit,
      this.ratio,
      this.attributes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a capped redemption agreement in status draft. */
export function newCappedRedemptionAgreement(code: string, label: string): CappedRedemptionAgreement {
  return new CappedRedemptionAgreement(code, label, 0, "", 0, 0, "", "", 0, 0, new Map<string, string>(), "draft");
}
