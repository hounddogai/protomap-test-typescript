/**
 * The rolling credit request records of attribution's credit work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a rolling credit request is in its life cycle. */
export type RollingCreditRequestStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a rolling credit request and its current status. */
export class RollingCreditRequest {
  code: string;
  name: string;
  archived: boolean;
  approved: boolean;
  attempts: number;
  category: string;
  durationMinutes: number;
  description: string;
  status: RollingCreditRequestStatus;

  constructor(
    code: string,
    name: string,
    archived: boolean,
    approved: boolean,
    attempts: number,
    category: string,
    durationMinutes: number,
    description: string,
    status: RollingCreditRequestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.archived = archived;
    this.approved = approved;
    this.attempts = attempts;
    this.category = category;
    this.durationMinutes = durationMinutes;
    this.description = description;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: RollingCreditRequestStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
            return true;
        }
        return false;
      case "warming":
        return next === "ready" || next === "draining";
      case "ready":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RollingCreditRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling credit request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  effectiveLoad(): number {
    return Math.round(this.durationMinutes * this.attempts * 100) / 100;
  }

  copy(): RollingCreditRequest {
    return new RollingCreditRequest(
      this.code,
      this.name,
      this.archived,
      this.approved,
      this.attempts,
      this.category,
      this.durationMinutes,
      this.description,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a rolling credit request in status idle. */
export function newRollingCreditRequest(code: string, name: string): RollingCreditRequest {
  return new RollingCreditRequest(code, name, false, false, 0, "", 0, "", "idle");
}
