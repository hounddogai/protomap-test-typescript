/**
 * The mention cycle records of social's mention work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a mention cycle is in its life cycle. */
export type MentionCycleStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A mention cycle as the mention team keeps it. */
export class MentionCycle {
  code: string;
  title: string;
  campaignRef: string;
  cohort: string;
  tags: string[];
  archived: boolean;
  checksum: string;
  variant: string;
  amount: number;
  status: MentionCycleStatus;

  constructor(
    code: string,
    title: string,
    campaignRef: string,
    cohort: string,
    tags: string[],
    archived: boolean,
    checksum: string,
    variant: string,
    amount: number,
    status: MentionCycleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.campaignRef = campaignRef;
    this.cohort = cohort;
    this.tags = tags;
    this.archived = archived;
    this.checksum = checksum;
    this.variant = variant;
    this.amount = amount;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: MentionCycleStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "rejected";
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: MentionCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`mention cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  measuredValue(): number {
    return this.amount;
  }

  copy(): MentionCycle {
    return new MentionCycle(
      this.code,
      this.title,
      this.campaignRef,
      this.cohort,
      this.tags,
      this.archived,
      this.checksum,
      this.variant,
      this.amount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a mention cycle in status proposed. */
export function newMentionCycle(code: string, title: string): MentionCycle {
  return new MentionCycle(code, title, "", "", [], false, "", "", 0, "proposed");
}
