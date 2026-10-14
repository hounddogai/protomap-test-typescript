import * as text from "../../../../kit/text.js";

/** Where a pending opt out manifest is in its life cycle. */
export type PendingOptOutManifestStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A pending opt out manifest. Its code is unique within a tenant. */
export class PendingOptOutManifest {
  code: string;
  name: string;
  durationMinutes: number;
  batchSize: number;
  bid: number;
  endsAt: number;
  label: string;
  audienceId: string;
  impressions: number;
  status: PendingOptOutManifestStatus;

  constructor(
    code: string,
    name: string,
    durationMinutes: number,
    batchSize: number,
    bid: number,
    endsAt: number,
    label: string,
    audienceId: string,
    impressions: number,
    status: PendingOptOutManifestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.durationMinutes = durationMinutes;
    this.batchSize = batchSize;
    this.bid = bid;
    this.endsAt = endsAt;
    this.label = label;
    this.audienceId = audienceId;
    this.impressions = impressions;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: PendingOptOutManifestStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "suspended" || next === "closed";
      case "pending":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PendingOptOutManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending opt out manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.name}]`;
  }

  projectedExposure(): number {
    return Math.round(this.batchSize * this.endsAt * 100) / 100;
  }

  copy(): PendingOptOutManifest {
    return new PendingOptOutManifest(
      this.code,
      this.name,
      this.durationMinutes,
      this.batchSize,
      this.bid,
      this.endsAt,
      this.label,
      this.audienceId,
      this.impressions,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a pending opt out manifest in status draft. */
export function newPendingOptOutManifest(code: string, name: string): PendingOptOutManifest {
  return new PendingOptOutManifest(code, name, 0, 0, 0, 0, "", "", 0, "draft");
}
