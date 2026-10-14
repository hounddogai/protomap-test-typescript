/**
 * The seasonal bid rule milestone records of adops's bid rule work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a seasonal bid rule milestone is in its life cycle. */
export type SeasonalBidRuleMilestoneStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One seasonal bid rule milestone, with what the planners need to act on it. */
export class SeasonalBidRuleMilestone {
  code: string;
  title: string;
  visible: boolean;
  checksum: string;
  category: string;
  externalRef: string;
  attributes: Map<string, string>;
  cohort: string;
  bid: number;
  name: string;
  notes: string;
  status: SeasonalBidRuleMilestoneStatus;

  constructor(
    code: string,
    title: string,
    visible: boolean,
    checksum: string,
    category: string,
    externalRef: string,
    attributes: Map<string, string>,
    cohort: string,
    bid: number,
    name: string,
    notes: string,
    status: SeasonalBidRuleMilestoneStatus,
  ) {
    this.code = code;
    this.title = title;
    this.visible = visible;
    this.checksum = checksum;
    this.category = category;
    this.externalRef = externalRef;
    this.attributes = attributes;
    this.cohort = cohort;
    this.bid = bid;
    this.name = name;
    this.notes = notes;
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

  canMoveTo(next: SeasonalBidRuleMilestoneStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending";
      case "pending":
        return next === "closed";
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

  moveTo(next: SeasonalBidRuleMilestoneStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal bid rule milestone ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"seasonal bid rule milestone"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  measuredValue(): number {
    return this.bid;
  }

  copy(): SeasonalBidRuleMilestone {
    return new SeasonalBidRuleMilestone(
      this.code,
      this.title,
      this.visible,
      this.checksum,
      this.category,
      this.externalRef,
      this.attributes,
      this.cohort,
      this.bid,
      this.name,
      this.notes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a seasonal bid rule milestone in status draft. */
export function newSeasonalBidRuleMilestone(code: string, title: string): SeasonalBidRuleMilestone {
  return new SeasonalBidRuleMilestone(
    code,
    title,
    false,
    "",
    "",
    "",
    new Map<string, string>(),
    "",
    0,
    "",
    "",
    "draft",
  );
}
