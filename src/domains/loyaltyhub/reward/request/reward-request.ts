/**
 * The reward request records of loyaltyhub's reward work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a reward request is in its life cycle. */
export type RewardRequestStatus = "created" | "validated" | "published" | "retired";

/** The record of a reward request and its current status. */
export class RewardRequest {
  code: string;
  label: string;
  retries: number;
  frequencyCap: number;
  endsAt: number;
  status: RewardRequestStatus;

  constructor(
    code: string,
    label: string,
    retries: number,
    frequencyCap: number,
    endsAt: number,
    status: RewardRequestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.retries = retries;
    this.frequencyCap = frequencyCap;
    this.endsAt = endsAt;
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

  canMoveTo(next: RewardRequestStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published" || next === "retired";
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

  moveTo(next: RewardRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reward request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  projectedTotal(): number {
    return Math.round((this.retries - this.frequencyCap) * 100) / 100;
  }

  copy(): RewardRequest {
    return new RewardRequest(this.code, this.label, this.retries, this.frequencyCap, this.endsAt, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a reward request in status created. */
export function newRewardRequest(code: string, label: string): RewardRequest {
  return new RewardRequest(code, label, 0, 0, 0, "created");
}
