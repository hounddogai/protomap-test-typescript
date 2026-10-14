import * as text from "../../../../kit/text.js";

/** Where a credit digest is in its life cycle. */
export type CreditDigestStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A credit digest as the credit team keeps it. */
export class CreditDigest {
  code: string;
  name: string;
  campaignRef: string;
  budget: number;
  attributes: Map<string, string>;
  attempts: number;
  status: CreditDigestStatus;

  constructor(
    code: string,
    name: string,
    campaignRef: string,
    budget: number,
    attributes: Map<string, string>,
    attempts: number,
    status: CreditDigestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.campaignRef = campaignRef;
    this.budget = budget;
    this.attributes = attributes;
    this.attempts = attempts;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: CreditDigestStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review";
      case "in_review":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        return next === "reopened";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CreditDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`credit digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"credit digest"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  weightedLoad(): number {
    return Math.round((this.attempts - this.budget) * 100) / 100;
  }

  copy(): CreditDigest {
    return new CreditDigest(
      this.code,
      this.name,
      this.campaignRef,
      this.budget,
      this.attributes,
      this.attempts,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a credit digest in status open. */
export function newCreditDigest(code: string, name: string): CreditDigest {
  return new CreditDigest(code, name, "", 0, new Map<string, string>(), 0, "open");
}
