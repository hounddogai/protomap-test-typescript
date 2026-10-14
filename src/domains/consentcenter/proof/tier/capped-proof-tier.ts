/**
 * The capped proof tier records of consentcenter's proof work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a capped proof tier is in its life cycle. */
export type CappedProofTierStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a capped proof tier and its current status. */
export class CappedProofTier {
  code: string;
  title: string;
  budget: number;
  expiresAt: number;
  reviewer: string;
  cohort: string;
  capacity: number;
  archived: boolean;
  priority: number;
  status: CappedProofTierStatus;

  constructor(
    code: string,
    title: string,
    budget: number,
    expiresAt: number,
    reviewer: string,
    cohort: string,
    capacity: number,
    archived: boolean,
    priority: number,
    status: CappedProofTierStatus,
  ) {
    this.code = code;
    this.title = title;
    this.budget = budget;
    this.expiresAt = expiresAt;
    this.reviewer = reviewer;
    this.cohort = cohort;
    this.capacity = capacity;
    this.archived = archived;
    this.priority = priority;
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

  canMoveTo(next: CappedProofTierStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "draining" || next === "stopped";
      case "warming":
        switch (next) {
          case "ready":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: CappedProofTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped proof tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  adjustedVolume(): number {
    return Math.round((this.priority + this.expiresAt) * 100) / 100;
  }

  copy(): CappedProofTier {
    return new CappedProofTier(
      this.code,
      this.title,
      this.budget,
      this.expiresAt,
      this.reviewer,
      this.cohort,
      this.capacity,
      this.archived,
      this.priority,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a capped proof tier in status idle. */
export function newCappedProofTier(code: string, title: string): CappedProofTier {
  return new CappedProofTier(code, title, 0, 0, "", "", 0, false, 0, "idle");
}
