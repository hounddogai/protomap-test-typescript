/**
 * The reward draft records of loyaltyhub's reward work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a reward draft is in its life cycle. */
export type RewardDraftStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One reward draft, with what the planners need to act on it. */
export class RewardDraft {
  code: string;
  title: string;
  batchSize: number;
  ceiling: number;
  startsAt: number;
  label: string;
  visible: boolean;
  status: RewardDraftStatus;

  constructor(
    code: string,
    title: string,
    batchSize: number,
    ceiling: number,
    startsAt: number,
    label: string,
    visible: boolean,
    status: RewardDraftStatus,
  ) {
    this.code = code;
    this.title = title;
    this.batchSize = batchSize;
    this.ceiling = ceiling;
    this.startsAt = startsAt;
    this.label = label;
    this.visible = visible;
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

  canMoveTo(next: RewardDraftStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review" || next === "resolved";
      case "in_review":
        switch (next) {
          case "resolved":
          case "archived":
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

  moveTo(next: RewardDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reward draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"reward draft"} ${this.code}`;
  }

  weightedVolume(): number {
    return Math.round((this.batchSize - this.ceiling) * 100) / 100;
  }

  copy(): RewardDraft {
    return new RewardDraft(
      this.code,
      this.title,
      this.batchSize,
      this.ceiling,
      this.startsAt,
      this.label,
      this.visible,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a reward draft in status open. */
export function newRewardDraft(code: string, title: string): RewardDraft {
  return new RewardDraft(code, title, 0, 0, 0, "", false, "open");
}
