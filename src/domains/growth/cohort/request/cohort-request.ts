/**
 * The cohort request records of growth's cohort work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a cohort request is in its life cycle. */
export type CohortRequestStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A cohort request as the cohort team keeps it. */
export class CohortRequest {
  code: string;
  name: string;
  attempts: number;
  variant: string;
  contactEmail: string;
  retries: number;
  ratio: number;
  channel: string;
  margin: number;
  createdAt: number;
  status: CohortRequestStatus;

  constructor(
    code: string,
    name: string,
    attempts: number,
    variant: string,
    contactEmail: string,
    retries: number,
    ratio: number,
    channel: string,
    margin: number,
    createdAt: number,
    status: CohortRequestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.attempts = attempts;
    this.variant = variant;
    this.contactEmail = contactEmail;
    this.retries = retries;
    this.ratio = ratio;
    this.channel = channel;
    this.margin = margin;
    this.createdAt = createdAt;
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

  canMoveTo(next: CohortRequestStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
          case "active":
            return true;
        }
        return false;
      case "pending":
        return next === "suspended";
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CohortRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`cohort request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  projectedExposure(): number {
    return Math.round(this.attempts * this.retries * 100) / 100;
  }

  copy(): CohortRequest {
    return new CohortRequest(
      this.code,
      this.name,
      this.attempts,
      this.variant,
      this.contactEmail,
      this.retries,
      this.ratio,
      this.channel,
      this.margin,
      this.createdAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a cohort request in status draft. */
export function newCohortRequest(code: string, name: string): CohortRequest {
  return new CohortRequest(code, name, 0, "", "", 0, 0, "", 0, 0, "draft");
}
