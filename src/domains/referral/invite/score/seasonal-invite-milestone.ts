import * as text from "../../../../kit/text.js";

/** Where a seasonal invite milestone is in its life cycle. */
export type SeasonalInviteMilestoneStatus = "requested" | "granted" | "revoked" | "expired";

/** One seasonal invite milestone, with what the planners need to act on it. */
export class SeasonalInviteMilestone {
  code: string;
  title: string;
  cost: number;
  frequencyCap: number;
  threshold: number;
  status: SeasonalInviteMilestoneStatus;

  constructor(
    code: string,
    title: string,
    cost: number,
    frequencyCap: number,
    threshold: number,
    status: SeasonalInviteMilestoneStatus,
  ) {
    this.code = code;
    this.title = title;
    this.cost = cost;
    this.frequencyCap = frequencyCap;
    this.threshold = threshold;
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

  canMoveTo(next: SeasonalInviteMilestoneStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "revoked";
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: SeasonalInviteMilestoneStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal invite milestone ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  projectedVolume(): number {
    return Math.round(this.frequencyCap * this.cost * 100) / 100;
  }

  copy(): SeasonalInviteMilestone {
    return new SeasonalInviteMilestone(
      this.code,
      this.title,
      this.cost,
      this.frequencyCap,
      this.threshold,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a seasonal invite milestone in status requested. */
export function newSeasonalInviteMilestone(code: string, title: string): SeasonalInviteMilestone {
  return new SeasonalInviteMilestone(code, title, 0, 0, 0, "requested");
}
