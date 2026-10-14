import * as text from "../../../../kit/text.js";

/** Where a leaderboard manifest is in its life cycle. */
export type LeaderboardManifestStatus = "requested" | "granted" | "revoked" | "expired";

/** A leaderboard manifest as the leaderboard team keeps it. */
export class LeaderboardManifest {
  code: string;
  name: string;
  title: string;
  category: string;
  frequencyCap: number;
  utmSource: string;
  version: number;
  status: LeaderboardManifestStatus;

  constructor(
    code: string,
    name: string,
    title: string,
    category: string,
    frequencyCap: number,
    utmSource: string,
    version: number,
    status: LeaderboardManifestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.title = title;
    this.category = category;
    this.frequencyCap = frequencyCap;
    this.utmSource = utmSource;
    this.version = version;
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

  canMoveTo(next: LeaderboardManifestStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
            return true;
        }
        return false;
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

  moveTo(next: LeaderboardManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`leaderboard manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  adjustedExposure(): number {
    return Math.round((this.version - this.frequencyCap) * 100) / 100;
  }

  copy(): LeaderboardManifest {
    return new LeaderboardManifest(
      this.code,
      this.name,
      this.title,
      this.category,
      this.frequencyCap,
      this.utmSource,
      this.version,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a leaderboard manifest in status requested. */
export function newLeaderboardManifest(code: string, name: string): LeaderboardManifest {
  return new LeaderboardManifest(code, name, "", "", 0, "", 0, "requested");
}
