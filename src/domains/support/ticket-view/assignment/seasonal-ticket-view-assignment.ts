import * as text from "../../../../kit/text.js";

/** Where a seasonal ticket view assignment is in its life cycle. */
export type SeasonalTicketViewAssignmentStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a seasonal ticket view assignment and its current status. */
export class SeasonalTicketViewAssignment {
  code: string;
  title: string;
  attempts: number;
  bid: number;
  revision: number;
  minimum: number;
  locale: string;
  region: string;
  version: number;
  channel: string;
  status: SeasonalTicketViewAssignmentStatus;

  constructor(
    code: string,
    title: string,
    attempts: number,
    bid: number,
    revision: number,
    minimum: number,
    locale: string,
    region: string,
    version: number,
    channel: string,
    status: SeasonalTicketViewAssignmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.attempts = attempts;
    this.bid = bid;
    this.revision = revision;
    this.minimum = minimum;
    this.locale = locale;
    this.region = region;
    this.version = version;
    this.channel = channel;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: SeasonalTicketViewAssignmentStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
          case "draining":
            return true;
        }
        return false;
      case "warming":
        return next === "ready" || next === "stopped";
      case "ready":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: SeasonalTicketViewAssignmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal ticket view assignment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  adjustedTotal(): number {
    return Math.round(this.bid * this.minimum * 100) / 100;
  }

  copy(): SeasonalTicketViewAssignment {
    return new SeasonalTicketViewAssignment(
      this.code,
      this.title,
      this.attempts,
      this.bid,
      this.revision,
      this.minimum,
      this.locale,
      this.region,
      this.version,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a seasonal ticket view assignment in status idle. */
export function newSeasonalTicketViewAssignment(code: string, title: string): SeasonalTicketViewAssignment {
  return new SeasonalTicketViewAssignment(code, title, 0, 0, 0, 0, "", "", 0, "", "idle");
}
