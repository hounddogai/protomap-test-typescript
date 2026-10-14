/**
 * The csat tier records of support's csat work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a csat tier is in its life cycle. */
export type CsatTierStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A csat tier. Its code is unique within a tenant. */
export class CsatTier {
  code: string;
  title: string;
  visible: boolean;
  cohort: string;
  channel: string;
  archived: boolean;
  budget: number;
  pinned: boolean;
  openRate: number;
  status: CsatTierStatus;

  constructor(
    code: string,
    title: string,
    visible: boolean,
    cohort: string,
    channel: string,
    archived: boolean,
    budget: number,
    pinned: boolean,
    openRate: number,
    status: CsatTierStatus,
  ) {
    this.code = code;
    this.title = title;
    this.visible = visible;
    this.cohort = cohort;
    this.channel = channel;
    this.archived = archived;
    this.budget = budget;
    this.pinned = pinned;
    this.openRate = openRate;
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

  canMoveTo(next: CsatTierStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "closed";
      case "pending":
        return next === "active";
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CsatTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`csat tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  effectiveVolume(): number {
    return Math.round(this.openRate * this.budget * 100) / 100;
  }

  copy(): CsatTier {
    return new CsatTier(
      this.code,
      this.title,
      this.visible,
      this.cohort,
      this.channel,
      this.archived,
      this.budget,
      this.pinned,
      this.openRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a csat tier in status draft. */
export function newCsatTier(code: string, title: string): CsatTier {
  return new CsatTier(code, title, false, "", "", false, 0, false, 0, "draft");
}
