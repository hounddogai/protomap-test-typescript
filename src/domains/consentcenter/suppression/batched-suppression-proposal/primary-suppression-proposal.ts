/**
 * The primary suppression proposal records of consentcenter's suppression work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a primary suppression proposal is in its life cycle. */
export type PrimarySuppressionProposalStatus = "created" | "validated" | "published" | "retired";

/** A primary suppression proposal. Its code is unique within a tenant. */
export class PrimarySuppressionProposal {
  code: string;
  label: string;
  notes: string;
  endsAt: number;
  clicks: number;
  expiresAt: number;
  description: string;
  status: PrimarySuppressionProposalStatus;

  constructor(
    code: string,
    label: string,
    notes: string,
    endsAt: number,
    clicks: number,
    expiresAt: number,
    description: string,
    status: PrimarySuppressionProposalStatus,
  ) {
    this.code = code;
    this.label = label;
    this.notes = notes;
    this.endsAt = endsAt;
    this.clicks = clicks;
    this.expiresAt = expiresAt;
    this.description = description;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: PrimarySuppressionProposalStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PrimarySuppressionProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary suppression proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"primary suppression proposal"} ${this.code}`;
  }

  weightedValue(): number {
    return Math.round(this.expiresAt * this.endsAt * 100) / 100;
  }

  copy(): PrimarySuppressionProposal {
    return new PrimarySuppressionProposal(
      this.code,
      this.label,
      this.notes,
      this.endsAt,
      this.clicks,
      this.expiresAt,
      this.description,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a primary suppression proposal in status created. */
export function newPrimarySuppressionProposal(code: string, label: string): PrimarySuppressionProposal {
  return new PrimarySuppressionProposal(code, label, "", 0, 0, 0, "", "created");
}
