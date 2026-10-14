/**
 * The reward adjustment records of loyaltyhub's reward work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a reward adjustment is in its life cycle. */
export type RewardAdjustmentStatus = "requested" | "granted" | "revoked" | "expired";

/** A reward adjustment as the reward team keeps it. */
export class RewardAdjustment {
  code: string;
  name: string;
  budget: number;
  currency: string;
  sequence: number;
  segment: string;
  variant: string;
  locale: string;
  attributes: Map<string, string>;
  description: string;
  weight: number;
  status: RewardAdjustmentStatus;

  constructor(
    code: string,
    name: string,
    budget: number,
    currency: string,
    sequence: number,
    segment: string,
    variant: string,
    locale: string,
    attributes: Map<string, string>,
    description: string,
    weight: number,
    status: RewardAdjustmentStatus,
  ) {
    this.code = code;
    this.name = name;
    this.budget = budget;
    this.currency = currency;
    this.sequence = sequence;
    this.segment = segment;
    this.variant = variant;
    this.locale = locale;
    this.attributes = attributes;
    this.description = description;
    this.weight = weight;
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

  canMoveTo(next: RewardAdjustmentStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "revoked" || next === "expired";
      case "granted":
        return next === "revoked";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: RewardAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reward adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  adjustedTotal(): number {
    return Math.round((this.sequence - this.weight) * 100) / 100;
  }

  copy(): RewardAdjustment {
    return new RewardAdjustment(
      this.code,
      this.name,
      this.budget,
      this.currency,
      this.sequence,
      this.segment,
      this.variant,
      this.locale,
      this.attributes,
      this.description,
      this.weight,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a reward adjustment in status requested. */
export function newRewardAdjustment(code: string, name: string): RewardAdjustment {
  return new RewardAdjustment(code, name, 0, "", 0, "", "", "", new Map<string, string>(), "", 0, "requested");
}
