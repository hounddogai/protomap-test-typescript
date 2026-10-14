/**
 * The lenient reward summary records of loyaltyhub's reward work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a lenient reward summary is in its life cycle. */
export type LenientRewardSummaryStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One lenient reward summary, with what the planners need to act on it. */
export class LenientRewardSummary {
  code: string;
  name: string;
  visible: boolean;
  journeyId: string;
  budget: number;
  contactEmail: string;
  archived: boolean;
  status: LenientRewardSummaryStatus;

  constructor(
    code: string,
    name: string,
    visible: boolean,
    journeyId: string,
    budget: number,
    contactEmail: string,
    archived: boolean,
    status: LenientRewardSummaryStatus,
  ) {
    this.code = code;
    this.name = name;
    this.visible = visible;
    this.journeyId = journeyId;
    this.budget = budget;
    this.contactEmail = contactEmail;
    this.archived = archived;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: LenientRewardSummaryStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: LenientRewardSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient reward summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"lenient reward summary"} ${this.code}`;
  }

  measuredValue(): number {
    return this.budget;
  }

  copy(): LenientRewardSummary {
    return new LenientRewardSummary(
      this.code,
      this.name,
      this.visible,
      this.journeyId,
      this.budget,
      this.contactEmail,
      this.archived,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a lenient reward summary in status planned. */
export function newLenientRewardSummary(code: string, name: string): LenientRewardSummary {
  return new LenientRewardSummary(code, name, false, "", 0, "", false, "planned");
}
