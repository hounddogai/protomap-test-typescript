import * as text from "../../../../kit/text.js";

/** Where a pending csat draft is in its life cycle. */
export type PendingCsatDraftStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a pending csat draft and its current status. */
export class PendingCsatDraft {
  code: string;
  name: string;
  journeyId: string;
  pinned: boolean;
  locale: string;
  amount: number;
  status: PendingCsatDraftStatus;

  constructor(
    code: string,
    name: string,
    journeyId: string,
    pinned: boolean,
    locale: string,
    amount: number,
    status: PendingCsatDraftStatus,
  ) {
    this.code = code;
    this.name = name;
    this.journeyId = journeyId;
    this.pinned = pinned;
    this.locale = locale;
    this.amount = amount;
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

  canMoveTo(next: PendingCsatDraftStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "active";
      case "pending":
        switch (next) {
          case "active":
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

  moveTo(next: PendingCsatDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending csat draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  measuredValue(): number {
    return this.amount;
  }

  copy(): PendingCsatDraft {
    return new PendingCsatDraft(
      this.code,
      this.name,
      this.journeyId,
      this.pinned,
      this.locale,
      this.amount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a pending csat draft in status draft. */
export function newPendingCsatDraft(code: string, name: string): PendingCsatDraft {
  return new PendingCsatDraft(code, name, "", false, "", 0, "draft");
}
