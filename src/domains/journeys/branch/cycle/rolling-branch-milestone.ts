import * as text from "../../../../kit/text.js";

/** Where a rolling branch milestone is in its life cycle. */
export type RollingBranchMilestoneStatus = "requested" | "granted" | "revoked" | "expired";

/** One rolling branch milestone, with what the planners need to act on it. */
export class RollingBranchMilestone {
  code: string;
  title: string;
  minimum: number;
  audienceId: string;
  segment: string;
  margin: number;
  tags: string[];
  cohort: string;
  impressions: number;
  ratio: number;
  region: string;
  status: RollingBranchMilestoneStatus;

  constructor(
    code: string,
    title: string,
    minimum: number,
    audienceId: string,
    segment: string,
    margin: number,
    tags: string[],
    cohort: string,
    impressions: number,
    ratio: number,
    region: string,
    status: RollingBranchMilestoneStatus,
  ) {
    this.code = code;
    this.title = title;
    this.minimum = minimum;
    this.audienceId = audienceId;
    this.segment = segment;
    this.margin = margin;
    this.tags = tags;
    this.cohort = cohort;
    this.impressions = impressions;
    this.ratio = ratio;
    this.region = region;
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

  canMoveTo(next: RollingBranchMilestoneStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "expired":
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

  moveTo(next: RollingBranchMilestoneStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling branch milestone ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"rolling branch milestone"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  adjustedLoad(): number {
    return Math.round((this.minimum - this.ratio) * 100) / 100;
  }

  copy(): RollingBranchMilestone {
    return new RollingBranchMilestone(
      this.code,
      this.title,
      this.minimum,
      this.audienceId,
      this.segment,
      this.margin,
      this.tags,
      this.cohort,
      this.impressions,
      this.ratio,
      this.region,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a rolling branch milestone in status requested. */
export function newRollingBranchMilestone(code: string, title: string): RollingBranchMilestone {
  return new RollingBranchMilestone(code, title, 0, "", "", 0, [], "", 0, 0, "", "requested");
}
