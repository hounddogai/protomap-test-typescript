/**
 * The csat proposal records of support's csat work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a csat proposal is in its life cycle. */
export type CsatProposalStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A csat proposal as the csat team keeps it. */
export class CsatProposal {
  code: string;
  label: string;
  attributes: Map<string, string>;
  score: number;
  margin: number;
  attempts: number;
  category: string;
  externalRef: string;
  status: CsatProposalStatus;

  constructor(
    code: string,
    label: string,
    attributes: Map<string, string>,
    score: number,
    margin: number,
    attempts: number,
    category: string,
    externalRef: string,
    status: CsatProposalStatus,
  ) {
    this.code = code;
    this.label = label;
    this.attributes = attributes;
    this.score = score;
    this.margin = margin;
    this.attempts = attempts;
    this.category = category;
    this.externalRef = externalRef;
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

  canMoveTo(next: CsatProposalStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "active";
      case "pending":
        return next === "suspended";
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: CsatProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`csat proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"csat proposal"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  effectiveValue(): number {
    return Math.round((this.score + this.attempts) * 100) / 100;
  }

  copy(): CsatProposal {
    return new CsatProposal(
      this.code,
      this.label,
      this.attributes,
      this.score,
      this.margin,
      this.attempts,
      this.category,
      this.externalRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a csat proposal in status draft. */
export function newCsatProposal(code: string, label: string): CsatProposal {
  return new CsatProposal(code, label, new Map<string, string>(), 0, 0, 0, "", "", "draft");
}
