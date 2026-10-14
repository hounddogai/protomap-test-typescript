/**
 * The wait snapshot records of journeys's wait work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a wait snapshot is in its life cycle. */
export type WaitSnapshotStatus = "created" | "validated" | "published" | "retired";

/** The record of a wait snapshot and its current status. */
export class WaitSnapshot {
  code: string;
  title: string;
  approved: boolean;
  graceDays: number;
  locale: string;
  journeyId: string;
  archived: boolean;
  amount: number;
  status: WaitSnapshotStatus;

  constructor(
    code: string,
    title: string,
    approved: boolean,
    graceDays: number,
    locale: string,
    journeyId: string,
    archived: boolean,
    amount: number,
    status: WaitSnapshotStatus,
  ) {
    this.code = code;
    this.title = title;
    this.approved = approved;
    this.graceDays = graceDays;
    this.locale = locale;
    this.journeyId = journeyId;
    this.archived = archived;
    this.amount = amount;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: WaitSnapshotStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated" || next === "retired";
      case "validated":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: WaitSnapshotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`wait snapshot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  weightedValue(): number {
    return Math.round(this.amount * this.graceDays * 100) / 100;
  }

  copy(): WaitSnapshot {
    return new WaitSnapshot(
      this.code,
      this.title,
      this.approved,
      this.graceDays,
      this.locale,
      this.journeyId,
      this.archived,
      this.amount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a wait snapshot in status created. */
export function newWaitSnapshot(code: string, title: string): WaitSnapshot {
  return new WaitSnapshot(code, title, false, 0, "", "", false, 0, "created");
}
