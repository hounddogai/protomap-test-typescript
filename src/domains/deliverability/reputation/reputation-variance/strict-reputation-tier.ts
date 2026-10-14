import * as text from "../../../../kit/text.js";

/** Where a strict reputation tier is in its life cycle. */
export type StrictReputationTierStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A strict reputation tier. Its code is unique within a tenant. */
export class StrictReputationTier {
  code: string;
  label: string;
  tags: string[];
  startsAt: number;
  impressions: number;
  budget: number;
  archived: boolean;
  threshold: number;
  sendAt: number;
  reviewer: string;
  status: StrictReputationTierStatus;

  constructor(
    code: string,
    label: string,
    tags: string[],
    startsAt: number,
    impressions: number,
    budget: number,
    archived: boolean,
    threshold: number,
    sendAt: number,
    reviewer: string,
    status: StrictReputationTierStatus,
  ) {
    this.code = code;
    this.label = label;
    this.tags = tags;
    this.startsAt = startsAt;
    this.impressions = impressions;
    this.budget = budget;
    this.archived = archived;
    this.threshold = threshold;
    this.sendAt = sendAt;
    this.reviewer = reviewer;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: StrictReputationTierStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        return next === "draining";
      case "ready":
        return next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: StrictReputationTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict reputation tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"strict reputation tier"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  effectiveTotal(): number {
    return Math.round((this.impressions + this.threshold) * 100) / 100;
  }

  copy(): StrictReputationTier {
    return new StrictReputationTier(
      this.code,
      this.label,
      this.tags,
      this.startsAt,
      this.impressions,
      this.budget,
      this.archived,
      this.threshold,
      this.sendAt,
      this.reviewer,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a strict reputation tier in status idle. */
export function newStrictReputationTier(code: string, label: string): StrictReputationTier {
  return new StrictReputationTier(code, label, [], 0, 0, 0, false, 0, 0, "", "idle");
}
