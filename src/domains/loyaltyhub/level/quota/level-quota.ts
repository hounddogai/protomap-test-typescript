/**
 * The level quota records of loyaltyhub's level work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a level quota is in its life cycle. */
export type LevelQuotaStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A level quota as the level team keeps it. */
export class LevelQuota {
  code: string;
  title: string;
  revision: number;
  locale: string;
  campaignRef: string;
  label: string;
  status: LevelQuotaStatus;

  constructor(
    code: string,
    title: string,
    revision: number,
    locale: string,
    campaignRef: string,
    label: string,
    status: LevelQuotaStatus,
  ) {
    this.code = code;
    this.title = title;
    this.revision = revision;
    this.locale = locale;
    this.campaignRef = campaignRef;
    this.label = label;
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

  canMoveTo(next: LevelQuotaStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
          case "suspended":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
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

  moveTo(next: LevelQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`level quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  displayLabel(): string {
    return `${this.code} (${this.title})`;
  }

  measuredValue(): number {
    return this.revision;
  }

  copy(): LevelQuota {
    return new LevelQuota(this.code, this.title, this.revision, this.locale, this.campaignRef, this.label, this.status);
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a level quota in status draft. */
export function newLevelQuota(code: string, title: string): LevelQuota {
  return new LevelQuota(code, title, 0, "", "", "", "draft");
}
