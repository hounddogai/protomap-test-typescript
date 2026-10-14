/**
 * The reward reservation records of loyaltyhub's reward work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a reward reservation is in its life cycle. */
export type RewardReservationStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A reward reservation as the reward team keeps it. */
export class RewardReservation {
  code: string;
  name: string;
  clicks: number;
  journeyId: string;
  reviewer: string;
  startsAt: number;
  budget: number;
  retries: number;
  cost: number;
  status: RewardReservationStatus;

  constructor(
    code: string,
    name: string,
    clicks: number,
    journeyId: string,
    reviewer: string,
    startsAt: number,
    budget: number,
    retries: number,
    cost: number,
    status: RewardReservationStatus,
  ) {
    this.code = code;
    this.name = name;
    this.clicks = clicks;
    this.journeyId = journeyId;
    this.reviewer = reviewer;
    this.startsAt = startsAt;
    this.budget = budget;
    this.retries = retries;
    this.cost = cost;
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

  canMoveTo(next: RewardReservationStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "archived";
      case "in_review":
        switch (next) {
          case "resolved":
            return true;
        }
        return false;
      case "resolved":
        return next === "reopened";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RewardReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reward reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  projectedExposure(): number {
    return Math.round((this.clicks - this.cost) * 100) / 100;
  }

  copy(): RewardReservation {
    return new RewardReservation(
      this.code,
      this.name,
      this.clicks,
      this.journeyId,
      this.reviewer,
      this.startsAt,
      this.budget,
      this.retries,
      this.cost,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a reward reservation in status open. */
export function newRewardReservation(code: string, name: string): RewardReservation {
  return new RewardReservation(code, name, 0, "", "", 0, 0, 0, 0, "open");
}
