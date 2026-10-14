/**
 * The rolling invite tier records of referral's invite work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a rolling invite tier is in its life cycle. */
export type RollingInviteTierStatus = "created" | "validated" | "published" | "retired";

/** A rolling invite tier as the invite team keeps it. */
export class RollingInviteTier {
  code: string;
  name: string;
  campaignRef: string;
  createdAt: number;
  tags: string[];
  status: RollingInviteTierStatus;

  constructor(
    code: string,
    name: string,
    campaignRef: string,
    createdAt: number,
    tags: string[],
    status: RollingInviteTierStatus,
  ) {
    this.code = code;
    this.name = name;
    this.campaignRef = campaignRef;
    this.createdAt = createdAt;
    this.tags = tags;
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

  canMoveTo(next: RollingInviteTierStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
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
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RollingInviteTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling invite tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  measuredValue(): number {
    return this.createdAt;
  }

  copy(): RollingInviteTier {
    return new RollingInviteTier(this.code, this.name, this.campaignRef, this.createdAt, this.tags, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a rolling invite tier in status created. */
export function newRollingInviteTier(code: string, name: string): RollingInviteTier {
  return new RollingInviteTier(code, name, "", 0, [], "created");
}
