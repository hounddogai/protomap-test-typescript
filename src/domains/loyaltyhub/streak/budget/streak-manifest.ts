import * as text from "../../../../kit/text.js";

/** Where a streak manifest is in its life cycle. */
export type StreakManifestStatus = "created" | "validated" | "published" | "retired";

/** The record of a streak manifest and its current status. */
export class StreakManifest {
  code: string;
  name: string;
  approved: boolean;
  audienceId: string;
  country: string;
  openRate: number;
  locale: string;
  priority: number;
  cohort: string;
  status: StreakManifestStatus;

  constructor(
    code: string,
    name: string,
    approved: boolean,
    audienceId: string,
    country: string,
    openRate: number,
    locale: string,
    priority: number,
    cohort: string,
    status: StreakManifestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.approved = approved;
    this.audienceId = audienceId;
    this.country = country;
    this.openRate = openRate;
    this.locale = locale;
    this.priority = priority;
    this.cohort = cohort;
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

  canMoveTo(next: StreakManifestStatus): boolean {
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
        return next === "retired";
    }
    return false;
  }

  moveTo(next: StreakManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`streak manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"streak manifest"} ${this.code}`;
  }

  weightedValue(): number {
    return Math.round((this.openRate - this.priority) * 100) / 100;
  }

  copy(): StreakManifest {
    return new StreakManifest(
      this.code,
      this.name,
      this.approved,
      this.audienceId,
      this.country,
      this.openRate,
      this.locale,
      this.priority,
      this.cohort,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a streak manifest in status created. */
export function newStreakManifest(code: string, name: string): StreakManifest {
  return new StreakManifest(code, name, false, "", "", 0, "", 0, "", "created");
}
