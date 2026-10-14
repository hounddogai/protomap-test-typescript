import * as text from "../../../../kit/text.js";

/** Where a regional badge manifest is in its life cycle. */
export type RegionalBadgeManifestStatus = "new" | "queued" | "running" | "done" | "failed";

/** One regional badge manifest, with what the planners need to act on it. */
export class RegionalBadgeManifest {
  code: string;
  name: string;
  openRate: number;
  capacity: number;
  graceDays: number;
  locale: string;
  threshold: number;
  status: RegionalBadgeManifestStatus;

  constructor(
    code: string,
    name: string,
    openRate: number,
    capacity: number,
    graceDays: number,
    locale: string,
    threshold: number,
    status: RegionalBadgeManifestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.openRate = openRate;
    this.capacity = capacity;
    this.graceDays = graceDays;
    this.locale = locale;
    this.threshold = threshold;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: RegionalBadgeManifestStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RegionalBadgeManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional badge manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  weightedVolume(): number {
    return Math.round((this.openRate + this.threshold) * 100) / 100;
  }

  copy(): RegionalBadgeManifest {
    return new RegionalBadgeManifest(
      this.code,
      this.name,
      this.openRate,
      this.capacity,
      this.graceDays,
      this.locale,
      this.threshold,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a regional badge manifest in status new. */
export function newRegionalBadgeManifest(code: string, name: string): RegionalBadgeManifest {
  return new RegionalBadgeManifest(code, name, 0, 0, 0, "", 0, "new");
}
