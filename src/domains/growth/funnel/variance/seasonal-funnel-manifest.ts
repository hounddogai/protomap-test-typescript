import * as text from "../../../../kit/text.js";

/** Where a seasonal funnel manifest is in its life cycle. */
export type SeasonalFunnelManifestStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A seasonal funnel manifest as the funnel team keeps it. */
export class SeasonalFunnelManifest {
  code: string;
  title: string;
  endsAt: number;
  updatedAt: number;
  limit: number;
  journeyId: string;
  notes: string;
  checksum: string;
  status: SeasonalFunnelManifestStatus;

  constructor(
    code: string,
    title: string,
    endsAt: number,
    updatedAt: number,
    limit: number,
    journeyId: string,
    notes: string,
    checksum: string,
    status: SeasonalFunnelManifestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.endsAt = endsAt;
    this.updatedAt = updatedAt;
    this.limit = limit;
    this.journeyId = journeyId;
    this.notes = notes;
    this.checksum = checksum;
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

  canMoveTo(next: SeasonalFunnelManifestStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "stopped";
      case "warming":
        return next === "ready";
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

  moveTo(next: SeasonalFunnelManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal funnel manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  netLoad(): number {
    return Math.round(this.limit * this.endsAt * 100) / 100;
  }

  copy(): SeasonalFunnelManifest {
    return new SeasonalFunnelManifest(
      this.code,
      this.title,
      this.endsAt,
      this.updatedAt,
      this.limit,
      this.journeyId,
      this.notes,
      this.checksum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a seasonal funnel manifest in status idle. */
export function newSeasonalFunnelManifest(code: string, title: string): SeasonalFunnelManifest {
  return new SeasonalFunnelManifest(code, title, 0, 0, 0, "", "", "", "idle");
}
