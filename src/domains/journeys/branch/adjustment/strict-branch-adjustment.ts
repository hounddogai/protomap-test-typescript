/**
 * The strict branch adjustment records of journeys's branch work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a strict branch adjustment is in its life cycle. */
export type StrictBranchAdjustmentStatus = "created" | "validated" | "published" | "retired";

/** The record of a strict branch adjustment and its current status. */
export class StrictBranchAdjustment {
  code: string;
  name: string;
  createdAt: number;
  contactEmail: string;
  approved: boolean;
  tags: string[];
  phone: string;
  endsAt: number;
  attributes: Map<string, string>;
  impressions: number;
  maximum: number;
  status: StrictBranchAdjustmentStatus;

  constructor(
    code: string,
    name: string,
    createdAt: number,
    contactEmail: string,
    approved: boolean,
    tags: string[],
    phone: string,
    endsAt: number,
    attributes: Map<string, string>,
    impressions: number,
    maximum: number,
    status: StrictBranchAdjustmentStatus,
  ) {
    this.code = code;
    this.name = name;
    this.createdAt = createdAt;
    this.contactEmail = contactEmail;
    this.approved = approved;
    this.tags = tags;
    this.phone = phone;
    this.endsAt = endsAt;
    this.attributes = attributes;
    this.impressions = impressions;
    this.maximum = maximum;
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

  canMoveTo(next: StrictBranchAdjustmentStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: StrictBranchAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict branch adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  netVolume(): number {
    return Math.round(this.impressions * this.createdAt * 100) / 100;
  }

  copy(): StrictBranchAdjustment {
    return new StrictBranchAdjustment(
      this.code,
      this.name,
      this.createdAt,
      this.contactEmail,
      this.approved,
      this.tags,
      this.phone,
      this.endsAt,
      this.attributes,
      this.impressions,
      this.maximum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a strict branch adjustment in status created. */
export function newStrictBranchAdjustment(code: string, name: string): StrictBranchAdjustment {
  return new StrictBranchAdjustment(code, name, 0, "", false, [], "", 0, new Map<string, string>(), 0, 0, "created");
}
