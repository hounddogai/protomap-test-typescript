/**
 * The lenient touchpoint variance records of attribution's touchpoint work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a lenient touchpoint variance is in its life cycle. */
export type LenientTouchpointVarianceStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a lenient touchpoint variance and its current status. */
export class LenientTouchpointVariance {
  code: string;
  name: string;
  updatedAt: number;
  archived: boolean;
  active: boolean;
  rate: number;
  budget: number;
  cohort: string;
  contactEmail: string;
  pinned: boolean;
  revision: number;
  status: LenientTouchpointVarianceStatus;

  constructor(
    code: string,
    name: string,
    updatedAt: number,
    archived: boolean,
    active: boolean,
    rate: number,
    budget: number,
    cohort: string,
    contactEmail: string,
    pinned: boolean,
    revision: number,
    status: LenientTouchpointVarianceStatus,
  ) {
    this.code = code;
    this.name = name;
    this.updatedAt = updatedAt;
    this.archived = archived;
    this.active = active;
    this.rate = rate;
    this.budget = budget;
    this.cohort = cohort;
    this.contactEmail = contactEmail;
    this.pinned = pinned;
    this.revision = revision;
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

  canMoveTo(next: LenientTouchpointVarianceStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending";
      case "pending":
        switch (next) {
          case "active":
          case "closed":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: LenientTouchpointVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient touchpoint variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  weightedExposure(): number {
    return Math.round((this.updatedAt + this.revision) * 100) / 100;
  }

  copy(): LenientTouchpointVariance {
    return new LenientTouchpointVariance(
      this.code,
      this.name,
      this.updatedAt,
      this.archived,
      this.active,
      this.rate,
      this.budget,
      this.cohort,
      this.contactEmail,
      this.pinned,
      this.revision,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a lenient touchpoint variance in status draft. */
export function newLenientTouchpointVariance(code: string, name: string): LenientTouchpointVariance {
  return new LenientTouchpointVariance(code, name, 0, false, false, 0, 0, "", "", false, 0, "draft");
}
