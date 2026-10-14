/**
 * The bounce request records of deliverability's bounce work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a bounce request is in its life cycle. */
export type BounceRequestStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a bounce request and its current status. */
export class BounceRequest {
  code: string;
  title: string;
  endsAt: number;
  revision: number;
  maximum: number;
  frequencyCap: number;
  budget: number;
  contactEmail: string;
  utmSource: string;
  reviewer: string;
  status: BounceRequestStatus;

  constructor(
    code: string,
    title: string,
    endsAt: number,
    revision: number,
    maximum: number,
    frequencyCap: number,
    budget: number,
    contactEmail: string,
    utmSource: string,
    reviewer: string,
    status: BounceRequestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.endsAt = endsAt;
    this.revision = revision;
    this.maximum = maximum;
    this.frequencyCap = frequencyCap;
    this.budget = budget;
    this.contactEmail = contactEmail;
    this.utmSource = utmSource;
    this.reviewer = reviewer;
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

  canMoveTo(next: BounceRequestStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "reopened" || next === "archived";
      case "in_review":
        return next === "resolved" || next === "archived";
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BounceRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`bounce request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  projectedLoad(): number {
    return Math.round((this.budget + this.endsAt) * 100) / 100;
  }

  copy(): BounceRequest {
    return new BounceRequest(
      this.code,
      this.title,
      this.endsAt,
      this.revision,
      this.maximum,
      this.frequencyCap,
      this.budget,
      this.contactEmail,
      this.utmSource,
      this.reviewer,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a bounce request in status open. */
export function newBounceRequest(code: string, title: string): BounceRequest {
  return new BounceRequest(code, title, 0, 0, 0, 0, 0, "", "", "", "open");
}
