/**
 * The wait draft records of journeys's wait work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a wait draft is in its life cycle. */
export type WaitDraftStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A wait draft. Its code is unique within a tenant. */
export class WaitDraft {
  code: string;
  title: string;
  budget: number;
  audienceId: string;
  archived: boolean;
  batchSize: number;
  journeyId: string;
  campaignRef: string;
  cohort: string;
  variant: string;
  status: WaitDraftStatus;

  constructor(
    code: string,
    title: string,
    budget: number,
    audienceId: string,
    archived: boolean,
    batchSize: number,
    journeyId: string,
    campaignRef: string,
    cohort: string,
    variant: string,
    status: WaitDraftStatus,
  ) {
    this.code = code;
    this.title = title;
    this.budget = budget;
    this.audienceId = audienceId;
    this.archived = archived;
    this.batchSize = batchSize;
    this.journeyId = journeyId;
    this.campaignRef = campaignRef;
    this.cohort = cohort;
    this.variant = variant;
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

  canMoveTo(next: WaitDraftStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "resolved";
      case "in_review":
        switch (next) {
          case "resolved":
          case "reopened":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: WaitDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`wait draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  weightedLoad(): number {
    return Math.round((this.budget + this.batchSize) * 100) / 100;
  }

  copy(): WaitDraft {
    return new WaitDraft(
      this.code,
      this.title,
      this.budget,
      this.audienceId,
      this.archived,
      this.batchSize,
      this.journeyId,
      this.campaignRef,
      this.cohort,
      this.variant,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a wait draft in status open. */
export function newWaitDraft(code: string, title: string): WaitDraft {
  return new WaitDraft(code, title, 0, "", false, 0, "", "", "", "", "open");
}
