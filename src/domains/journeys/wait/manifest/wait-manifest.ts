/**
 * The wait manifest records of journeys's wait work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a wait manifest is in its life cycle. */
export type WaitManifestStatus = "created" | "validated" | "published" | "retired";

/** The record of a wait manifest and its current status. */
export class WaitManifest {
  code: string;
  title: string;
  archived: boolean;
  bid: number;
  region: string;
  ceiling: number;
  windowDays: number;
  notes: string;
  rate: number;
  status: WaitManifestStatus;

  constructor(
    code: string,
    title: string,
    archived: boolean,
    bid: number,
    region: string,
    ceiling: number,
    windowDays: number,
    notes: string,
    rate: number,
    status: WaitManifestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.archived = archived;
    this.bid = bid;
    this.region = region;
    this.ceiling = ceiling;
    this.windowDays = windowDays;
    this.notes = notes;
    this.rate = rate;
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

  canMoveTo(next: WaitManifestStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated";
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WaitManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`wait manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  netValue(): number {
    return Math.round(this.windowDays * this.ceiling * 100) / 100;
  }

  copy(): WaitManifest {
    return new WaitManifest(
      this.code,
      this.title,
      this.archived,
      this.bid,
      this.region,
      this.ceiling,
      this.windowDays,
      this.notes,
      this.rate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a wait manifest in status created. */
export function newWaitManifest(code: string, title: string): WaitManifest {
  return new WaitManifest(code, title, false, 0, "", 0, 0, "", 0, "created");
}
