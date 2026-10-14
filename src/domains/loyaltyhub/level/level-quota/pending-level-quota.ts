/**
 * The pending level quota records of loyaltyhub's level work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a pending level quota is in its life cycle. */
export type PendingLevelQuotaStatus = "new" | "queued" | "running" | "done" | "failed";

/** One pending level quota, with what the planners need to act on it. */
export class PendingLevelQuota {
  code: string;
  label: string;
  windowDays: number;
  summary: string;
  contactEmail: string;
  pinned: boolean;
  status: PendingLevelQuotaStatus;

  constructor(
    code: string,
    label: string,
    windowDays: number,
    summary: string,
    contactEmail: string,
    pinned: boolean,
    status: PendingLevelQuotaStatus,
  ) {
    this.code = code;
    this.label = label;
    this.windowDays = windowDays;
    this.summary = summary;
    this.contactEmail = contactEmail;
    this.pinned = pinned;
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

  canMoveTo(next: PendingLevelQuotaStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "queued":
        return next === "done";
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: PendingLevelQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending level quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  measuredValue(): number {
    return this.windowDays;
  }

  copy(): PendingLevelQuota {
    return new PendingLevelQuota(
      this.code,
      this.label,
      this.windowDays,
      this.summary,
      this.contactEmail,
      this.pinned,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a pending level quota in status new. */
export function newPendingLevelQuota(code: string, label: string): PendingLevelQuota {
  return new PendingLevelQuota(code, label, 0, "", "", false, "new");
}
