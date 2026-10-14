/**
 * The adaptive csat request records of support's csat work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a adaptive csat request is in its life cycle. */
export type AdaptiveCsatRequestStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a adaptive csat request and its current status. */
export class AdaptiveCsatRequest {
  code: string;
  name: string;
  graceDays: number;
  source: string;
  contactEmail: string;
  status: AdaptiveCsatRequestStatus;

  constructor(
    code: string,
    name: string,
    graceDays: number,
    source: string,
    contactEmail: string,
    status: AdaptiveCsatRequestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.graceDays = graceDays;
    this.source = source;
    this.contactEmail = contactEmail;
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

  canMoveTo(next: AdaptiveCsatRequestStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "closed";
      case "pending":
        return next === "active" || next === "closed";
      case "active":
        switch (next) {
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

  moveTo(next: AdaptiveCsatRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive csat request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  measuredValue(): number {
    return this.graceDays;
  }

  copy(): AdaptiveCsatRequest {
    return new AdaptiveCsatRequest(this.code, this.name, this.graceDays, this.source, this.contactEmail, this.status);
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a adaptive csat request in status draft. */
export function newAdaptiveCsatRequest(code: string, name: string): AdaptiveCsatRequest {
  return new AdaptiveCsatRequest(code, name, 0, "", "", "draft");
}
