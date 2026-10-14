/**
 * The batched ticket view tier records of support's ticket view work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a batched ticket view tier is in its life cycle. */
export type BatchedTicketViewTierStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a batched ticket view tier and its current status. */
export class BatchedTicketViewTier {
  code: string;
  label: string;
  title: string;
  journeyId: string;
  country: string;
  ratio: number;
  version: number;
  budget: number;
  reviewer: string;
  notes: string;
  capacity: number;
  status: BatchedTicketViewTierStatus;

  constructor(
    code: string,
    label: string,
    title: string,
    journeyId: string,
    country: string,
    ratio: number,
    version: number,
    budget: number,
    reviewer: string,
    notes: string,
    capacity: number,
    status: BatchedTicketViewTierStatus,
  ) {
    this.code = code;
    this.label = label;
    this.title = title;
    this.journeyId = journeyId;
    this.country = country;
    this.ratio = ratio;
    this.version = version;
    this.budget = budget;
    this.reviewer = reviewer;
    this.notes = notes;
    this.capacity = capacity;
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

  canMoveTo(next: BatchedTicketViewTierStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming" || next === "stopped";
      case "warming":
        switch (next) {
          case "draining":
          case "stopped":
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

  moveTo(next: BatchedTicketViewTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched ticket view tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  netVolume(): number {
    return Math.round((this.version + this.capacity) * 100) / 100;
  }

  copy(): BatchedTicketViewTier {
    return new BatchedTicketViewTier(
      this.code,
      this.label,
      this.title,
      this.journeyId,
      this.country,
      this.ratio,
      this.version,
      this.budget,
      this.reviewer,
      this.notes,
      this.capacity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a batched ticket view tier in status idle. */
export function newBatchedTicketViewTier(code: string, label: string): BatchedTicketViewTier {
  return new BatchedTicketViewTier(code, label, "", "", "", 0, 0, 0, "", "", 0, "idle");
}
