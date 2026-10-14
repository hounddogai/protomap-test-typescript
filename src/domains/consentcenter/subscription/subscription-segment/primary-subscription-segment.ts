/**
 * The primary subscription segment records of consentcenter's subscription work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a primary subscription segment is in its life cycle. */
export type PrimarySubscriptionSegmentStatus = "requested" | "granted" | "revoked" | "expired";

/** A primary subscription segment. Its code is unique within a tenant. */
export class PrimarySubscriptionSegment {
  code: string;
  title: string;
  margin: number;
  minimum: number;
  startsAt: number;
  updatedAt: number;
  tags: string[];
  status: PrimarySubscriptionSegmentStatus;

  constructor(
    code: string,
    title: string,
    margin: number,
    minimum: number,
    startsAt: number,
    updatedAt: number,
    tags: string[],
    status: PrimarySubscriptionSegmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.margin = margin;
    this.minimum = minimum;
    this.startsAt = startsAt;
    this.updatedAt = updatedAt;
    this.tags = tags;
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

  canMoveTo(next: PrimarySubscriptionSegmentStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted";
      case "granted":
        return next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PrimarySubscriptionSegmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary subscription segment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"primary subscription segment"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  netTotal(): number {
    return Math.round((this.margin - this.startsAt) * 100) / 100;
  }

  copy(): PrimarySubscriptionSegment {
    return new PrimarySubscriptionSegment(
      this.code,
      this.title,
      this.margin,
      this.minimum,
      this.startsAt,
      this.updatedAt,
      this.tags,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a primary subscription segment in status requested. */
export function newPrimarySubscriptionSegment(code: string, title: string): PrimarySubscriptionSegment {
  return new PrimarySubscriptionSegment(code, title, 0, 0, 0, 0, [], "requested");
}
