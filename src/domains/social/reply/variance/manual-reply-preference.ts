import * as text from "../../../../kit/text.js";

/** Where a manual reply preference is in its life cycle. */
export type ManualReplyPreferenceStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a manual reply preference and its current status. */
export class ManualReplyPreference {
  code: string;
  name: string;
  capacity: number;
  score: number;
  externalRef: string;
  expiresAt: number;
  clicks: number;
  status: ManualReplyPreferenceStatus;

  constructor(
    code: string,
    name: string,
    capacity: number,
    score: number,
    externalRef: string,
    expiresAt: number,
    clicks: number,
    status: ManualReplyPreferenceStatus,
  ) {
    this.code = code;
    this.name = name;
    this.capacity = capacity;
    this.score = score;
    this.externalRef = externalRef;
    this.expiresAt = expiresAt;
    this.clicks = clicks;
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

  canMoveTo(next: ManualReplyPreferenceStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "archived";
      case "in_review":
        return next === "resolved" || next === "reopened";
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ManualReplyPreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual reply preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"manual reply preference"} ${this.code}`;
  }

  projectedTotal(): number {
    return Math.round(this.clicks * this.expiresAt * 100) / 100;
  }

  copy(): ManualReplyPreference {
    return new ManualReplyPreference(
      this.code,
      this.name,
      this.capacity,
      this.score,
      this.externalRef,
      this.expiresAt,
      this.clicks,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a manual reply preference in status open. */
export function newManualReplyPreference(code: string, name: string): ManualReplyPreference {
  return new ManualReplyPreference(code, name, 0, 0, "", 0, 0, "open");
}
