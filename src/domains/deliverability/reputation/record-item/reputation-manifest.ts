import * as text from "../../../../kit/text.js";

/** Where a reputation manifest is in its life cycle. */
export type ReputationManifestStatus = "created" | "validated" | "published" | "retired";

/** The record of a reputation manifest and its current status. */
export class ReputationManifest {
  code: string;
  title: string;
  variant: string;
  description: string;
  channel: string;
  label: string;
  segment: string;
  batchSize: number;
  category: string;
  impressions: number;
  rate: number;
  status: ReputationManifestStatus;

  constructor(
    code: string,
    title: string,
    variant: string,
    description: string,
    channel: string,
    label: string,
    segment: string,
    batchSize: number,
    category: string,
    impressions: number,
    rate: number,
    status: ReputationManifestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.variant = variant;
    this.description = description;
    this.channel = channel;
    this.label = label;
    this.segment = segment;
    this.batchSize = batchSize;
    this.category = category;
    this.impressions = impressions;
    this.rate = rate;
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

  canMoveTo(next: ReputationManifestStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "published":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
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

  moveTo(next: ReputationManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reputation manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.title})`;
  }

  effectiveExposure(): number {
    return Math.round((this.batchSize - this.rate) * 100) / 100;
  }

  copy(): ReputationManifest {
    return new ReputationManifest(
      this.code,
      this.title,
      this.variant,
      this.description,
      this.channel,
      this.label,
      this.segment,
      this.batchSize,
      this.category,
      this.impressions,
      this.rate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a reputation manifest in status created. */
export function newReputationManifest(code: string, title: string): ReputationManifest {
  return new ReputationManifest(code, title, "", "", "", "", "", 0, "", 0, 0, "created");
}
