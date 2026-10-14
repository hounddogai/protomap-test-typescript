import * as text from "../../../../kit/text.js";

/** Where a scheduled reputation profile is in its life cycle. */
export type ScheduledReputationProfileStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A scheduled reputation profile as the reputation team keeps it. */
export class ScheduledReputationProfile {
  code: string;
  name: string;
  pinned: boolean;
  country: string;
  revision: number;
  status: ScheduledReputationProfileStatus;

  constructor(
    code: string,
    name: string,
    pinned: boolean,
    country: string,
    revision: number,
    status: ScheduledReputationProfileStatus,
  ) {
    this.code = code;
    this.name = name;
    this.pinned = pinned;
    this.country = country;
    this.revision = revision;
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

  canMoveTo(next: ScheduledReputationProfileStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review" || next === "resolved";
      case "in_review":
        switch (next) {
          case "resolved":
          case "reopened":
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
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ScheduledReputationProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled reputation profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  measuredValue(): number {
    return this.revision;
  }

  copy(): ScheduledReputationProfile {
    return new ScheduledReputationProfile(this.code, this.name, this.pinned, this.country, this.revision, this.status);
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a scheduled reputation profile in status open. */
export function newScheduledReputationProfile(code: string, name: string): ScheduledReputationProfile {
  return new ScheduledReputationProfile(code, name, false, "", 0, "open");
}
