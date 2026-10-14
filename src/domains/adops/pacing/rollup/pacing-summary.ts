import * as text from "../../../../kit/text.js";

/** Where a pacing summary is in its life cycle. */
export type PacingSummaryStatus = "new" | "queued" | "running" | "done" | "failed";

/** A pacing summary. Its code is unique within a tenant. */
export class PacingSummary {
  code: string;
  name: string;
  capacity: number;
  country: string;
  checksum: string;
  windowDays: number;
  maximum: number;
  description: string;
  cost: number;
  channel: string;
  limit: number;
  status: PacingSummaryStatus;

  constructor(
    code: string,
    name: string,
    capacity: number,
    country: string,
    checksum: string,
    windowDays: number,
    maximum: number,
    description: string,
    cost: number,
    channel: string,
    limit: number,
    status: PacingSummaryStatus,
  ) {
    this.code = code;
    this.name = name;
    this.capacity = capacity;
    this.country = country;
    this.checksum = checksum;
    this.windowDays = windowDays;
    this.maximum = maximum;
    this.description = description;
    this.cost = cost;
    this.channel = channel;
    this.limit = limit;
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

  canMoveTo(next: PacingSummaryStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "queued":
        return next === "done";
      case "running":
        return next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PacingSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pacing summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  netLoad(): number {
    return Math.round(this.limit * this.windowDays * 100) / 100;
  }

  copy(): PacingSummary {
    return new PacingSummary(
      this.code,
      this.name,
      this.capacity,
      this.country,
      this.checksum,
      this.windowDays,
      this.maximum,
      this.description,
      this.cost,
      this.channel,
      this.limit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a pacing summary in status new. */
export function newPacingSummary(code: string, name: string): PacingSummary {
  return new PacingSummary(code, name, 0, "", "", 0, 0, "", 0, "", 0, "new");
}
