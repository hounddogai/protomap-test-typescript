import * as text from "../../../../kit/text.js";

/** Where a path preference is in its life cycle. */
export type PathPreferenceStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One path preference, with what the planners need to act on it. */
export class PathPreference {
  code: string;
  title: string;
  createdAt: number;
  checksum: string;
  floorValue: number;
  source: string;
  expiresAt: number;
  region: string;
  openRate: number;
  status: PathPreferenceStatus;

  constructor(
    code: string,
    title: string,
    createdAt: number,
    checksum: string,
    floorValue: number,
    source: string,
    expiresAt: number,
    region: string,
    openRate: number,
    status: PathPreferenceStatus,
  ) {
    this.code = code;
    this.title = title;
    this.createdAt = createdAt;
    this.checksum = checksum;
    this.floorValue = floorValue;
    this.source = source;
    this.expiresAt = expiresAt;
    this.region = region;
    this.openRate = openRate;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: PathPreferenceStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "withdrawn";
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: PathPreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`path preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  projectedTotal(): number {
    return Math.round((this.floorValue + this.createdAt) * 100) / 100;
  }

  copy(): PathPreference {
    return new PathPreference(
      this.code,
      this.title,
      this.createdAt,
      this.checksum,
      this.floorValue,
      this.source,
      this.expiresAt,
      this.region,
      this.openRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a path preference in status proposed. */
export function newPathPreference(code: string, title: string): PathPreference {
  return new PathPreference(code, title, 0, "", 0, "", 0, "", 0, "proposed");
}
