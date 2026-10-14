/**
 * The capped paywall draft records of growth's paywall work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a capped paywall draft is in its life cycle. */
export type CappedPaywallDraftStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a capped paywall draft and its current status. */
export class CappedPaywallDraft {
  code: string;
  title: string;
  pinned: boolean;
  windowDays: number;
  revision: number;
  updatedAt: number;
  margin: number;
  frequencyCap: number;
  approved: boolean;
  status: CappedPaywallDraftStatus;

  constructor(
    code: string,
    title: string,
    pinned: boolean,
    windowDays: number,
    revision: number,
    updatedAt: number,
    margin: number,
    frequencyCap: number,
    approved: boolean,
    status: CappedPaywallDraftStatus,
  ) {
    this.code = code;
    this.title = title;
    this.pinned = pinned;
    this.windowDays = windowDays;
    this.revision = revision;
    this.updatedAt = updatedAt;
    this.margin = margin;
    this.frequencyCap = frequencyCap;
    this.approved = approved;
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

  canMoveTo(next: CappedPaywallDraftStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "withdrawn";
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

  moveTo(next: CappedPaywallDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped paywall draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${"capped paywall draft"} ${this.code}`;
  }

  weightedLoad(): number {
    return Math.round((this.frequencyCap - this.updatedAt) * 100) / 100;
  }

  copy(): CappedPaywallDraft {
    return new CappedPaywallDraft(
      this.code,
      this.title,
      this.pinned,
      this.windowDays,
      this.revision,
      this.updatedAt,
      this.margin,
      this.frequencyCap,
      this.approved,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a capped paywall draft in status proposed. */
export function newCappedPaywallDraft(code: string, title: string): CappedPaywallDraft {
  return new CappedPaywallDraft(code, title, false, 0, 0, 0, 0, 0, false, "proposed");
}
