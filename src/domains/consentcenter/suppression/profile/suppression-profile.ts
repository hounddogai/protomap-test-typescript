/**
 * The suppression profile records of consentcenter's suppression work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a suppression profile is in its life cycle. */
export type SuppressionProfileStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A suppression profile. Its code is unique within a tenant. */
export class SuppressionProfile {
  code: string;
  title: string;
  approved: boolean;
  floorValue: number;
  cost: number;
  pinned: boolean;
  region: string;
  tags: string[];
  channel: string;
  retries: number;
  ratio: number;
  status: SuppressionProfileStatus;

  constructor(
    code: string,
    title: string,
    approved: boolean,
    floorValue: number,
    cost: number,
    pinned: boolean,
    region: string,
    tags: string[],
    channel: string,
    retries: number,
    ratio: number,
    status: SuppressionProfileStatus,
  ) {
    this.code = code;
    this.title = title;
    this.approved = approved;
    this.floorValue = floorValue;
    this.cost = cost;
    this.pinned = pinned;
    this.region = region;
    this.tags = tags;
    this.channel = channel;
    this.retries = retries;
    this.ratio = ratio;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: SuppressionProfileStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress";
      case "scheduled":
        switch (next) {
          case "in_progress":
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        return next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SuppressionProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`suppression profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  weightedValue(): number {
    return Math.round((this.floorValue + this.retries) * 100) / 100;
  }

  copy(): SuppressionProfile {
    return new SuppressionProfile(
      this.code,
      this.title,
      this.approved,
      this.floorValue,
      this.cost,
      this.pinned,
      this.region,
      this.tags,
      this.channel,
      this.retries,
      this.ratio,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a suppression profile in status planned. */
export function newSuppressionProfile(code: string, title: string): SuppressionProfile {
  return new SuppressionProfile(code, title, false, 0, 0, false, "", [], "", 0, 0, "planned");
}
