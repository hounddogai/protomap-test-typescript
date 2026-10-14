import * as text from "../../../../kit/text.js";

/** Where a retention bundle is in its life cycle. */
export type RetentionBundleStatus = "created" | "validated" | "published" | "retired";

/** A retention bundle. Its code is unique within a tenant. */
export class RetentionBundle {
  code: string;
  label: string;
  name: string;
  batchSize: number;
  clicks: number;
  score: number;
  openRate: number;
  campaignRef: string;
  variant: string;
  status: RetentionBundleStatus;

  constructor(
    code: string,
    label: string,
    name: string,
    batchSize: number,
    clicks: number,
    score: number,
    openRate: number,
    campaignRef: string,
    variant: string,
    status: RetentionBundleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.name = name;
    this.batchSize = batchSize;
    this.clicks = clicks;
    this.score = score;
    this.openRate = openRate;
    this.campaignRef = campaignRef;
    this.variant = variant;
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

  canMoveTo(next: RetentionBundleStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "published":
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

  moveTo(next: RetentionBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`retention bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"retention bundle"} ${this.code}`;
  }

  adjustedVolume(): number {
    return Math.round((this.score + this.openRate) * 100) / 100;
  }

  copy(): RetentionBundle {
    return new RetentionBundle(
      this.code,
      this.label,
      this.name,
      this.batchSize,
      this.clicks,
      this.score,
      this.openRate,
      this.campaignRef,
      this.variant,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a retention bundle in status created. */
export function newRetentionBundle(code: string, label: string): RetentionBundle {
  return new RetentionBundle(code, label, "", 0, 0, 0, 0, "", "", "created");
}
