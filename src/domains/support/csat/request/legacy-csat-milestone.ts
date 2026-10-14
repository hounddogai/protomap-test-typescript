import * as text from "../../../../kit/text.js";

/** Where a legacy csat milestone is in its life cycle. */
export type LegacyCsatMilestoneStatus = "created" | "validated" | "published" | "retired";

/** A legacy csat milestone as the csat team keeps it. */
export class LegacyCsatMilestone {
  code: string;
  title: string;
  openRate: number;
  graceDays: number;
  revision: number;
  summary: string;
  channel: string;
  status: LegacyCsatMilestoneStatus;

  constructor(
    code: string,
    title: string,
    openRate: number,
    graceDays: number,
    revision: number,
    summary: string,
    channel: string,
    status: LegacyCsatMilestoneStatus,
  ) {
    this.code = code;
    this.title = title;
    this.openRate = openRate;
    this.graceDays = graceDays;
    this.revision = revision;
    this.summary = summary;
    this.channel = channel;
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

  canMoveTo(next: LegacyCsatMilestoneStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "validated":
        return next === "retired";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LegacyCsatMilestoneStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy csat milestone ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  netExposure(): number {
    return Math.round((this.openRate - this.revision) * 100) / 100;
  }

  copy(): LegacyCsatMilestone {
    return new LegacyCsatMilestone(
      this.code,
      this.title,
      this.openRate,
      this.graceDays,
      this.revision,
      this.summary,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a legacy csat milestone in status created. */
export function newLegacyCsatMilestone(code: string, title: string): LegacyCsatMilestone {
  return new LegacyCsatMilestone(code, title, 0, 0, 0, "", "", "created");
}
