/**
 * The bid rule agreement records of adops's bid rule work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a bid rule agreement is in its life cycle. */
export type BidRuleAgreementStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A bid rule agreement. Its code is unique within a tenant. */
export class BidRuleAgreement {
  code: string;
  label: string;
  score: number;
  cost: number;
  attempts: number;
  audienceId: string;
  name: string;
  source: string;
  phone: string;
  locale: string;
  weight: number;
  status: BidRuleAgreementStatus;

  constructor(
    code: string,
    label: string,
    score: number,
    cost: number,
    attempts: number,
    audienceId: string,
    name: string,
    source: string,
    phone: string,
    locale: string,
    weight: number,
    status: BidRuleAgreementStatus,
  ) {
    this.code = code;
    this.label = label;
    this.score = score;
    this.cost = cost;
    this.attempts = attempts;
    this.audienceId = audienceId;
    this.name = name;
    this.source = source;
    this.phone = phone;
    this.locale = locale;
    this.weight = weight;
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

  canMoveTo(next: BidRuleAgreementStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "active" || next === "closed";
      case "pending":
        return next === "active" || next === "suspended";
      case "active":
        switch (next) {
          case "suspended":
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

  moveTo(next: BidRuleAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`bid rule agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  effectiveLoad(): number {
    return Math.round(this.weight * this.cost * 100) / 100;
  }

  copy(): BidRuleAgreement {
    return new BidRuleAgreement(
      this.code,
      this.label,
      this.score,
      this.cost,
      this.attempts,
      this.audienceId,
      this.name,
      this.source,
      this.phone,
      this.locale,
      this.weight,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a bid rule agreement in status draft. */
export function newBidRuleAgreement(code: string, label: string): BidRuleAgreement {
  return new BidRuleAgreement(code, label, 0, 0, 0, "", "", "", "", "", 0, "draft");
}
