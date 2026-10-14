/**
 * The reply draft records of social's reply work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a reply draft is in its life cycle. */
export type ReplyDraftStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A reply draft as the reply team keeps it. */
export class ReplyDraft {
  code: string;
  label: string;
  cost: number;
  channel: string;
  floorValue: number;
  score: number;
  clicks: number;
  locale: string;
  cohort: string;
  status: ReplyDraftStatus;

  constructor(
    code: string,
    label: string,
    cost: number,
    channel: string,
    floorValue: number,
    score: number,
    clicks: number,
    locale: string,
    cohort: string,
    status: ReplyDraftStatus,
  ) {
    this.code = code;
    this.label = label;
    this.cost = cost;
    this.channel = channel;
    this.floorValue = floorValue;
    this.score = score;
    this.clicks = clicks;
    this.locale = locale;
    this.cohort = cohort;
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

  canMoveTo(next: ReplyDraftStatus): boolean {
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

  moveTo(next: ReplyDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reply draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"reply draft"} ${this.code}`;
  }

  netLoad(): number {
    return Math.round((this.score + this.cost) * 100) / 100;
  }

  copy(): ReplyDraft {
    return new ReplyDraft(
      this.code,
      this.label,
      this.cost,
      this.channel,
      this.floorValue,
      this.score,
      this.clicks,
      this.locale,
      this.cohort,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a reply draft in status proposed. */
export function newReplyDraft(code: string, label: string): ReplyDraft {
  return new ReplyDraft(code, label, 0, "", 0, 0, 0, "", "", "proposed");
}
