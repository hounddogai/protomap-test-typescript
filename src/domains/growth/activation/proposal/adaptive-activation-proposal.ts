/**
 * The adaptive activation proposal records of growth's activation work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a adaptive activation proposal is in its life cycle. */
export type AdaptiveActivationProposalStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a adaptive activation proposal and its current status. */
export class AdaptiveActivationProposal {
  code: string;
  label: string;
  utmSource: string;
  budget: number;
  attributes: Map<string, string>;
  ownerId: string;
  country: string;
  status: AdaptiveActivationProposalStatus;

  constructor(
    code: string,
    label: string,
    utmSource: string,
    budget: number,
    attributes: Map<string, string>,
    ownerId: string,
    country: string,
    status: AdaptiveActivationProposalStatus,
  ) {
    this.code = code;
    this.label = label;
    this.utmSource = utmSource;
    this.budget = budget;
    this.attributes = attributes;
    this.ownerId = ownerId;
    this.country = country;
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

  canMoveTo(next: AdaptiveActivationProposalStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
          case "running":
            return true;
        }
        return false;
      case "queued":
        return next === "done";
      case "running":
        return next === "done";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: AdaptiveActivationProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive activation proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"adaptive activation proposal"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  measuredValue(): number {
    return this.budget;
  }

  copy(): AdaptiveActivationProposal {
    return new AdaptiveActivationProposal(
      this.code,
      this.label,
      this.utmSource,
      this.budget,
      this.attributes,
      this.ownerId,
      this.country,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a adaptive activation proposal in status new. */
export function newAdaptiveActivationProposal(code: string, label: string): AdaptiveActivationProposal {
  return new AdaptiveActivationProposal(code, label, "", 0, new Map<string, string>(), "", "", "new");
}
