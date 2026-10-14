import * as text from "../../../../kit/text.js";

/** Where a legacy path milestone is in its life cycle. */
export type LegacyPathMilestoneStatus = "new" | "queued" | "running" | "done" | "failed";

/** One legacy path milestone, with what the planners need to act on it. */
export class LegacyPathMilestone {
  code: string;
  name: string;
  revision: number;
  rate: number;
  contactEmail: string;
  reviewer: string;
  retries: number;
  region: string;
  status: LegacyPathMilestoneStatus;

  constructor(
    code: string,
    name: string,
    revision: number,
    rate: number,
    contactEmail: string,
    reviewer: string,
    retries: number,
    region: string,
    status: LegacyPathMilestoneStatus,
  ) {
    this.code = code;
    this.name = name;
    this.revision = revision;
    this.rate = rate;
    this.contactEmail = contactEmail;
    this.reviewer = reviewer;
    this.retries = retries;
    this.region = region;
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

  canMoveTo(next: LegacyPathMilestoneStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "running":
          case "done":
            return true;
        }
        return false;
      case "queued":
        return next === "running" || next === "failed";
      case "running":
        return next === "done" || next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LegacyPathMilestoneStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy path milestone ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  netLoad(): number {
    return Math.round((this.rate - this.retries) * 100) / 100;
  }

  copy(): LegacyPathMilestone {
    return new LegacyPathMilestone(
      this.code,
      this.name,
      this.revision,
      this.rate,
      this.contactEmail,
      this.reviewer,
      this.retries,
      this.region,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a legacy path milestone in status new. */
export function newLegacyPathMilestone(code: string, name: string): LegacyPathMilestone {
  return new LegacyPathMilestone(code, name, 0, 0, "", "", 0, "", "new");
}
