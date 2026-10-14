import * as text from "../../../../kit/text.js";

/** Where a batched bounce manifest is in its life cycle. */
export type BatchedBounceManifestStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One batched bounce manifest, with what the planners need to act on it. */
export class BatchedBounceManifest {
  code: string;
  name: string;
  impressions: number;
  startsAt: number;
  archived: boolean;
  rate: number;
  sendAt: number;
  pinned: boolean;
  reviewer: string;
  locale: string;
  status: BatchedBounceManifestStatus;

  constructor(
    code: string,
    name: string,
    impressions: number,
    startsAt: number,
    archived: boolean,
    rate: number,
    sendAt: number,
    pinned: boolean,
    reviewer: string,
    locale: string,
    status: BatchedBounceManifestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.impressions = impressions;
    this.startsAt = startsAt;
    this.archived = archived;
    this.rate = rate;
    this.sendAt = sendAt;
    this.pinned = pinned;
    this.reviewer = reviewer;
    this.locale = locale;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: BatchedBounceManifestStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "archived";
      case "in_review":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: BatchedBounceManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched bounce manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  effectiveVolume(): number {
    return Math.round(this.startsAt * this.rate * 100) / 100;
  }

  copy(): BatchedBounceManifest {
    return new BatchedBounceManifest(
      this.code,
      this.name,
      this.impressions,
      this.startsAt,
      this.archived,
      this.rate,
      this.sendAt,
      this.pinned,
      this.reviewer,
      this.locale,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a batched bounce manifest in status open. */
export function newBatchedBounceManifest(code: string, name: string): BatchedBounceManifest {
  return new BatchedBounceManifest(code, name, 0, 0, false, 0, 0, false, "", "", "open");
}
