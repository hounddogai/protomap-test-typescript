import * as text from "../../../../kit/text.js";

/** Where a scheduled domain score is in its life cycle. */
export type ScheduledDomainScoreStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One scheduled domain score, with what the planners need to act on it. */
export class ScheduledDomainScore {
  code: string;
  label: string;
  margin: number;
  channel: string;
  ownerId: string;
  cost: number;
  ceiling: number;
  batchSize: number;
  floorValue: number;
  limit: number;
  status: ScheduledDomainScoreStatus;

  constructor(
    code: string,
    label: string,
    margin: number,
    channel: string,
    ownerId: string,
    cost: number,
    ceiling: number,
    batchSize: number,
    floorValue: number,
    limit: number,
    status: ScheduledDomainScoreStatus,
  ) {
    this.code = code;
    this.label = label;
    this.margin = margin;
    this.channel = channel;
    this.ownerId = ownerId;
    this.cost = cost;
    this.ceiling = ceiling;
    this.batchSize = batchSize;
    this.floorValue = floorValue;
    this.limit = limit;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: ScheduledDomainScoreStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
          case "rejected":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ScheduledDomainScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled domain score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  adjustedLoad(): number {
    return Math.round(this.limit * this.batchSize * 100) / 100;
  }

  copy(): ScheduledDomainScore {
    return new ScheduledDomainScore(
      this.code,
      this.label,
      this.margin,
      this.channel,
      this.ownerId,
      this.cost,
      this.ceiling,
      this.batchSize,
      this.floorValue,
      this.limit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a scheduled domain score in status proposed. */
export function newScheduledDomainScore(code: string, label: string): ScheduledDomainScore {
  return new ScheduledDomainScore(code, label, 0, "", "", 0, 0, 0, 0, 0, "proposed");
}
