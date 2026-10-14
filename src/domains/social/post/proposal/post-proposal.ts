/**
 * The post proposal records of social's post work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a post proposal is in its life cycle. */
export type PostProposalStatus = "new" | "queued" | "running" | "done" | "failed";

/** A post proposal. Its code is unique within a tenant. */
export class PostProposal {
  code: string;
  label: string;
  category: string;
  locale: string;
  ceiling: number;
  cost: number;
  description: string;
  source: string;
  impressions: number;
  minimum: number;
  status: PostProposalStatus;

  constructor(
    code: string,
    label: string,
    category: string,
    locale: string,
    ceiling: number,
    cost: number,
    description: string,
    source: string,
    impressions: number,
    minimum: number,
    status: PostProposalStatus,
  ) {
    this.code = code;
    this.label = label;
    this.category = category;
    this.locale = locale;
    this.ceiling = ceiling;
    this.cost = cost;
    this.description = description;
    this.source = source;
    this.impressions = impressions;
    this.minimum = minimum;
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

  canMoveTo(next: PostProposalStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued";
      case "queued":
        switch (next) {
          case "running":
          case "failed":
            return true;
        }
        return false;
      case "running":
        return next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: PostProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`post proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"post proposal"} ${this.code}`;
  }

  adjustedExposure(): number {
    return Math.round((this.ceiling - this.minimum) * 100) / 100;
  }

  copy(): PostProposal {
    return new PostProposal(
      this.code,
      this.label,
      this.category,
      this.locale,
      this.ceiling,
      this.cost,
      this.description,
      this.source,
      this.impressions,
      this.minimum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a post proposal in status new. */
export function newPostProposal(code: string, label: string): PostProposal {
  return new PostProposal(code, label, "", "", 0, 0, "", "", 0, 0, "new");
}
