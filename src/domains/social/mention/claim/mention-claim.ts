/**
 * The mention claim records of social's mention work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a mention claim is in its life cycle. */
export type MentionClaimStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One mention claim, with what the planners need to act on it. */
export class MentionClaim {
  code: string;
  label: string;
  variant: string;
  name: string;
  budget: number;
  channel: string;
  description: string;
  region: string;
  sequence: number;
  updatedAt: number;
  status: MentionClaimStatus;

  constructor(
    code: string,
    label: string,
    variant: string,
    name: string,
    budget: number,
    channel: string,
    description: string,
    region: string,
    sequence: number,
    updatedAt: number,
    status: MentionClaimStatus,
  ) {
    this.code = code;
    this.label = label;
    this.variant = variant;
    this.name = name;
    this.budget = budget;
    this.channel = channel;
    this.description = description;
    this.region = region;
    this.sequence = sequence;
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

  canMoveTo(next: MentionClaimStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "completed";
      case "scheduled":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: MentionClaimStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`mention claim ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"mention claim"} ${this.code}`;
  }

  effectiveVolume(): number {
    return Math.round(this.updatedAt * this.sequence * 100) / 100;
  }

  copy(): MentionClaim {
    return new MentionClaim(
      this.code,
      this.label,
      this.variant,
      this.name,
      this.budget,
      this.channel,
      this.description,
      this.region,
      this.sequence,
      this.updatedAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a mention claim in status planned. */
export function newMentionClaim(code: string, label: string): MentionClaim {
  return new MentionClaim(code, label, "", "", 0, "", "", "", 0, 0, "planned");
}
