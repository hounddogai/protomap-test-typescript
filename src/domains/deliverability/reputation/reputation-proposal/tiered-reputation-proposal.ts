/**
 * The tiered reputation proposal records of deliverability's reputation work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a tiered reputation proposal is in its life cycle. */
export type TieredReputationProposalStatus = "new" | "queued" | "running" | "done" | "failed";

/** One tiered reputation proposal, with what the planners need to act on it. */
export class TieredReputationProposal {
  code: string;
  name: string;
  openRate: number;
  approved: boolean;
  budget: number;
  summary: string;
  attributes: Map<string, string>;
  status: TieredReputationProposalStatus;

  constructor(
    code: string,
    name: string,
    openRate: number,
    approved: boolean,
    budget: number,
    summary: string,
    attributes: Map<string, string>,
    status: TieredReputationProposalStatus,
  ) {
    this.code = code;
    this.name = name;
    this.openRate = openRate;
    this.approved = approved;
    this.budget = budget;
    this.summary = summary;
    this.attributes = attributes;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: TieredReputationProposalStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "running":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TieredReputationProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered reputation proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  projectedVolume(): number {
    return Math.round((this.openRate - this.budget) * 100) / 100;
  }

  copy(): TieredReputationProposal {
    return new TieredReputationProposal(
      this.code,
      this.name,
      this.openRate,
      this.approved,
      this.budget,
      this.summary,
      this.attributes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a tiered reputation proposal in status new. */
export function newTieredReputationProposal(code: string, name: string): TieredReputationProposal {
  return new TieredReputationProposal(code, name, 0, false, 0, "", new Map<string, string>(), "new");
}
