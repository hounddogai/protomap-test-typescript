/**
 * The proof summary records of consentcenter's proof work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a proof summary is in its life cycle. */
export type ProofSummaryStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One proof summary, with what the planners need to act on it. */
export class ProofSummary {
  code: string;
  name: string;
  contactEmail: string;
  revision: number;
  startsAt: number;
  ceiling: number;
  ownerId: string;
  conversionRate: number;
  batchSize: number;
  impressions: number;
  status: ProofSummaryStatus;

  constructor(
    code: string,
    name: string,
    contactEmail: string,
    revision: number,
    startsAt: number,
    ceiling: number,
    ownerId: string,
    conversionRate: number,
    batchSize: number,
    impressions: number,
    status: ProofSummaryStatus,
  ) {
    this.code = code;
    this.name = name;
    this.contactEmail = contactEmail;
    this.revision = revision;
    this.startsAt = startsAt;
    this.ceiling = ceiling;
    this.ownerId = ownerId;
    this.conversionRate = conversionRate;
    this.batchSize = batchSize;
    this.impressions = impressions;
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

  canMoveTo(next: ProofSummaryStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
          case "active":
            return true;
        }
        return false;
      case "pending":
        return next === "active" || next === "suspended";
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

  moveTo(next: ProofSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`proof summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  weightedValue(): number {
    return Math.round((this.ceiling + this.batchSize) * 100) / 100;
  }

  copy(): ProofSummary {
    return new ProofSummary(
      this.code,
      this.name,
      this.contactEmail,
      this.revision,
      this.startsAt,
      this.ceiling,
      this.ownerId,
      this.conversionRate,
      this.batchSize,
      this.impressions,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a proof summary in status draft. */
export function newProofSummary(code: string, name: string): ProofSummary {
  return new ProofSummary(code, name, "", 0, 0, 0, "", 0, 0, 0, "draft");
}
