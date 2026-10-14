/**
 * The bounce claim records of deliverability's bounce work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a bounce claim is in its life cycle. */
export type BounceClaimStatus = "requested" | "granted" | "revoked" | "expired";

/** A bounce claim as the bounce team keeps it. */
export class BounceClaim {
  code: string;
  title: string;
  unit: string;
  region: string;
  summary: string;
  revision: number;
  notes: string;
  score: number;
  budget: number;
  channel: string;
  status: BounceClaimStatus;

  constructor(
    code: string,
    title: string,
    unit: string,
    region: string,
    summary: string,
    revision: number,
    notes: string,
    score: number,
    budget: number,
    channel: string,
    status: BounceClaimStatus,
  ) {
    this.code = code;
    this.title = title;
    this.unit = unit;
    this.region = region;
    this.summary = summary;
    this.revision = revision;
    this.notes = notes;
    this.score = score;
    this.budget = budget;
    this.channel = channel;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: BounceClaimStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "revoked":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: BounceClaimStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`bounce claim ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  weightedTotal(): number {
    return Math.round(this.score * this.revision * 100) / 100;
  }

  copy(): BounceClaim {
    return new BounceClaim(
      this.code,
      this.title,
      this.unit,
      this.region,
      this.summary,
      this.revision,
      this.notes,
      this.score,
      this.budget,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a bounce claim in status requested. */
export function newBounceClaim(code: string, title: string): BounceClaim {
  return new BounceClaim(code, title, "", "", "", 0, "", 0, 0, "", "requested");
}
