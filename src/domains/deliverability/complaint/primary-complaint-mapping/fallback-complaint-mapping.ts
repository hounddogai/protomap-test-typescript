/**
 * The fallback complaint mapping records of deliverability's complaint work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a fallback complaint mapping is in its life cycle. */
export type FallbackComplaintMappingStatus = "created" | "validated" | "published" | "retired";

/** A fallback complaint mapping as the complaint team keeps it. */
export class FallbackComplaintMapping {
  code: string;
  name: string;
  maximum: number;
  ratio: number;
  score: number;
  pinned: boolean;
  graceDays: number;
  priority: number;
  endsAt: number;
  approved: boolean;
  attributes: Map<string, string>;
  status: FallbackComplaintMappingStatus;

  constructor(
    code: string,
    name: string,
    maximum: number,
    ratio: number,
    score: number,
    pinned: boolean,
    graceDays: number,
    priority: number,
    endsAt: number,
    approved: boolean,
    attributes: Map<string, string>,
    status: FallbackComplaintMappingStatus,
  ) {
    this.code = code;
    this.name = name;
    this.maximum = maximum;
    this.ratio = ratio;
    this.score = score;
    this.pinned = pinned;
    this.graceDays = graceDays;
    this.priority = priority;
    this.endsAt = endsAt;
    this.approved = approved;
    this.attributes = attributes;
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

  canMoveTo(next: FallbackComplaintMappingStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "validated":
        return next === "published";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: FallbackComplaintMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback complaint mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"fallback complaint mapping"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  projectedVolume(): number {
    return Math.round((this.endsAt + this.score) * 100) / 100;
  }

  copy(): FallbackComplaintMapping {
    return new FallbackComplaintMapping(
      this.code,
      this.name,
      this.maximum,
      this.ratio,
      this.score,
      this.pinned,
      this.graceDays,
      this.priority,
      this.endsAt,
      this.approved,
      this.attributes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a fallback complaint mapping in status created. */
export function newFallbackComplaintMapping(code: string, name: string): FallbackComplaintMapping {
  return new FallbackComplaintMapping(code, name, 0, 0, 0, false, 0, 0, 0, false, new Map<string, string>(), "created");
}
