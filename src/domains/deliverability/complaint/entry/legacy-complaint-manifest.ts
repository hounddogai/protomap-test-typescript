import * as text from "../../../../kit/text.js";

/** Where a legacy complaint manifest is in its life cycle. */
export type LegacyComplaintManifestStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a legacy complaint manifest and its current status. */
export class LegacyComplaintManifest {
  code: string;
  title: string;
  tags: string[];
  startsAt: number;
  country: string;
  discount: number;
  impressions: number;
  durationMinutes: number;
  name: string;
  checksum: string;
  status: LegacyComplaintManifestStatus;

  constructor(
    code: string,
    title: string,
    tags: string[],
    startsAt: number,
    country: string,
    discount: number,
    impressions: number,
    durationMinutes: number,
    name: string,
    checksum: string,
    status: LegacyComplaintManifestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.tags = tags;
    this.startsAt = startsAt;
    this.country = country;
    this.discount = discount;
    this.impressions = impressions;
    this.durationMinutes = durationMinutes;
    this.name = name;
    this.checksum = checksum;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: LegacyComplaintManifestStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "revoked";
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LegacyComplaintManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy complaint manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  netExposure(): number {
    return Math.round((this.startsAt - this.durationMinutes) * 100) / 100;
  }

  copy(): LegacyComplaintManifest {
    return new LegacyComplaintManifest(
      this.code,
      this.title,
      this.tags,
      this.startsAt,
      this.country,
      this.discount,
      this.impressions,
      this.durationMinutes,
      this.name,
      this.checksum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a legacy complaint manifest in status requested. */
export function newLegacyComplaintManifest(code: string, title: string): LegacyComplaintManifest {
  return new LegacyComplaintManifest(code, title, [], 0, "", 0, 0, 0, "", "", "requested");
}
