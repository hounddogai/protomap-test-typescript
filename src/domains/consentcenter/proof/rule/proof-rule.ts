/**
 * The proof rule records of consentcenter's proof work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a proof rule is in its life cycle. */
export type ProofRuleStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A proof rule as the proof team keeps it. */
export class ProofRule {
  code: string;
  name: string;
  clicks: number;
  revision: number;
  audienceId: string;
  margin: number;
  discount: number;
  contactEmail: string;
  version: number;
  expiresAt: number;
  status: ProofRuleStatus;

  constructor(
    code: string,
    name: string,
    clicks: number,
    revision: number,
    audienceId: string,
    margin: number,
    discount: number,
    contactEmail: string,
    version: number,
    expiresAt: number,
    status: ProofRuleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.clicks = clicks;
    this.revision = revision;
    this.audienceId = audienceId;
    this.margin = margin;
    this.discount = discount;
    this.contactEmail = contactEmail;
    this.version = version;
    this.expiresAt = expiresAt;
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

  canMoveTo(next: ProofRuleStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
          case "resolved":
            return true;
        }
        return false;
      case "in_review":
        return next === "reopened" || next === "archived";
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

  moveTo(next: ProofRuleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`proof rule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  adjustedVolume(): number {
    return Math.round((this.expiresAt + this.discount) * 100) / 100;
  }

  copy(): ProofRule {
    return new ProofRule(
      this.code,
      this.name,
      this.clicks,
      this.revision,
      this.audienceId,
      this.margin,
      this.discount,
      this.contactEmail,
      this.version,
      this.expiresAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a proof rule in status open. */
export function newProofRule(code: string, name: string): ProofRule {
  return new ProofRule(code, name, 0, 0, "", 0, 0, "", 0, 0, "open");
}
