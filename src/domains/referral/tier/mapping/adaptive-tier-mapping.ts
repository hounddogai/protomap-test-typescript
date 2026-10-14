/**
 * The adaptive tier mapping records of referral's tier work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a adaptive tier mapping is in its life cycle. */
export type AdaptiveTierMappingStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A adaptive tier mapping. Its code is unique within a tenant. */
export class AdaptiveTierMapping {
  code: string;
  label: string;
  region: string;
  tags: string[];
  updatedAt: number;
  status: AdaptiveTierMappingStatus;

  constructor(
    code: string,
    label: string,
    region: string,
    tags: string[],
    updatedAt: number,
    status: AdaptiveTierMappingStatus,
  ) {
    this.code = code;
    this.label = label;
    this.region = region;
    this.tags = tags;
    this.updatedAt = updatedAt;
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

  canMoveTo(next: AdaptiveTierMappingStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "completed":
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

  moveTo(next: AdaptiveTierMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive tier mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  measuredValue(): number {
    return this.updatedAt;
  }

  copy(): AdaptiveTierMapping {
    return new AdaptiveTierMapping(this.code, this.label, this.region, this.tags, this.updatedAt, this.status);
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a adaptive tier mapping in status planned. */
export function newAdaptiveTierMapping(code: string, label: string): AdaptiveTierMapping {
  return new AdaptiveTierMapping(code, label, "", [], 0, "planned");
}
