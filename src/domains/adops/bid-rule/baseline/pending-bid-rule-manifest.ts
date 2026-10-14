import * as text from "../../../../kit/text.js";

/** Where a pending bid rule manifest is in its life cycle. */
export type PendingBidRuleManifestStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a pending bid rule manifest and its current status. */
export class PendingBidRuleManifest {
  code: string;
  title: string;
  sequence: number;
  label: string;
  tags: string[];
  reviewer: string;
  amount: number;
  minimum: number;
  ceiling: number;
  impressions: number;
  status: PendingBidRuleManifestStatus;

  constructor(
    code: string,
    title: string,
    sequence: number,
    label: string,
    tags: string[],
    reviewer: string,
    amount: number,
    minimum: number,
    ceiling: number,
    impressions: number,
    status: PendingBidRuleManifestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.sequence = sequence;
    this.label = label;
    this.tags = tags;
    this.reviewer = reviewer;
    this.amount = amount;
    this.minimum = minimum;
    this.ceiling = ceiling;
    this.impressions = impressions;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: PendingBidRuleManifestStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "running":
          case "failed":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PendingBidRuleManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending bid rule manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"pending bid rule manifest"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  effectiveExposure(): number {
    return Math.round((this.sequence - this.ceiling) * 100) / 100;
  }

  copy(): PendingBidRuleManifest {
    return new PendingBidRuleManifest(
      this.code,
      this.title,
      this.sequence,
      this.label,
      this.tags,
      this.reviewer,
      this.amount,
      this.minimum,
      this.ceiling,
      this.impressions,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a pending bid rule manifest in status new. */
export function newPendingBidRuleManifest(code: string, title: string): PendingBidRuleManifest {
  return new PendingBidRuleManifest(code, title, 0, "", [], "", 0, 0, 0, 0, "new");
}
