import * as text from "../../../../kit/text.js";

/** Where a scheduled ticket view score is in its life cycle. */
export type ScheduledTicketViewScoreStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a scheduled ticket view score and its current status. */
export class ScheduledTicketViewScore {
  code: string;
  name: string;
  active: boolean;
  region: string;
  ratio: number;
  variant: string;
  archived: boolean;
  channel: string;
  batchSize: number;
  status: ScheduledTicketViewScoreStatus;

  constructor(
    code: string,
    name: string,
    active: boolean,
    region: string,
    ratio: number,
    variant: string,
    archived: boolean,
    channel: string,
    batchSize: number,
    status: ScheduledTicketViewScoreStatus,
  ) {
    this.code = code;
    this.name = name;
    this.active = active;
    this.region = region;
    this.ratio = ratio;
    this.variant = variant;
    this.archived = archived;
    this.channel = channel;
    this.batchSize = batchSize;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: ScheduledTicketViewScoreStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
          case "in_progress":
            return true;
        }
        return false;
      case "scheduled":
        return next === "completed" || next === "cancelled";
      case "in_progress":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: ScheduledTicketViewScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled ticket view score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"scheduled ticket view score"} ${this.code}`;
  }

  netVolume(): number {
    return Math.round((this.batchSize - this.ratio) * 100) / 100;
  }

  copy(): ScheduledTicketViewScore {
    return new ScheduledTicketViewScore(
      this.code,
      this.name,
      this.active,
      this.region,
      this.ratio,
      this.variant,
      this.archived,
      this.channel,
      this.batchSize,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a scheduled ticket view score in status planned. */
export function newScheduledTicketViewScore(code: string, name: string): ScheduledTicketViewScore {
  return new ScheduledTicketViewScore(code, name, false, "", 0, "", false, "", 0, "planned");
}
