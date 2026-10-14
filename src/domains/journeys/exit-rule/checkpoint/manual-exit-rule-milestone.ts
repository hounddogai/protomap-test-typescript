import * as text from "../../../../kit/text.js";

/** Where a manual exit rule milestone is in its life cycle. */
export type ManualExitRuleMilestoneStatus = "new" | "queued" | "running" | "done" | "failed";

/** One manual exit rule milestone, with what the planners need to act on it. */
export class ManualExitRuleMilestone {
  code: string;
  name: string;
  utmSource: string;
  weight: number;
  campaignRef: string;
  endsAt: number;
  channel: string;
  expiresAt: number;
  minimum: number;
  maximum: number;
  ceiling: number;
  status: ManualExitRuleMilestoneStatus;

  constructor(
    code: string,
    name: string,
    utmSource: string,
    weight: number,
    campaignRef: string,
    endsAt: number,
    channel: string,
    expiresAt: number,
    minimum: number,
    maximum: number,
    ceiling: number,
    status: ManualExitRuleMilestoneStatus,
  ) {
    this.code = code;
    this.name = name;
    this.utmSource = utmSource;
    this.weight = weight;
    this.campaignRef = campaignRef;
    this.endsAt = endsAt;
    this.channel = channel;
    this.expiresAt = expiresAt;
    this.minimum = minimum;
    this.maximum = maximum;
    this.ceiling = ceiling;
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

  canMoveTo(next: ManualExitRuleMilestoneStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
          case "failed":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "running":
            return true;
        }
        return false;
      case "running":
        return next === "done" || next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: ManualExitRuleMilestoneStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual exit rule milestone ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  adjustedLoad(): number {
    return Math.round((this.expiresAt - this.ceiling) * 100) / 100;
  }

  copy(): ManualExitRuleMilestone {
    return new ManualExitRuleMilestone(
      this.code,
      this.name,
      this.utmSource,
      this.weight,
      this.campaignRef,
      this.endsAt,
      this.channel,
      this.expiresAt,
      this.minimum,
      this.maximum,
      this.ceiling,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a manual exit rule milestone in status new. */
export function newManualExitRuleMilestone(code: string, name: string): ManualExitRuleMilestone {
  return new ManualExitRuleMilestone(code, name, "", 0, "", 0, "", 0, 0, 0, 0, "new");
}
