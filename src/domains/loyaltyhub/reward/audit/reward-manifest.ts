import * as text from "../../../../kit/text.js";

/** Where a reward manifest is in its life cycle. */
export type RewardManifestStatus = "created" | "validated" | "published" | "retired";

/** One reward manifest, with what the planners need to act on it. */
export class RewardManifest {
  code: string;
  title: string;
  country: string;
  source: string;
  archived: boolean;
  batchSize: number;
  campaignRef: string;
  retries: number;
  status: RewardManifestStatus;

  constructor(
    code: string,
    title: string,
    country: string,
    source: string,
    archived: boolean,
    batchSize: number,
    campaignRef: string,
    retries: number,
    status: RewardManifestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.country = country;
    this.source = source;
    this.archived = archived;
    this.batchSize = batchSize;
    this.campaignRef = campaignRef;
    this.retries = retries;
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

  canMoveTo(next: RewardManifestStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
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
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RewardManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reward manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  weightedVolume(): number {
    return Math.round(this.batchSize * this.retries * 100) / 100;
  }

  copy(): RewardManifest {
    return new RewardManifest(
      this.code,
      this.title,
      this.country,
      this.source,
      this.archived,
      this.batchSize,
      this.campaignRef,
      this.retries,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a reward manifest in status created. */
export function newRewardManifest(code: string, title: string): RewardManifest {
  return new RewardManifest(code, title, "", "", false, 0, "", 0, "created");
}
