import * as text from "../../../../kit/text.js";

/** Where a seasonal model checkpoint is in its life cycle. */
export type SeasonalModelCheckpointStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a seasonal model checkpoint and its current status. */
export class SeasonalModelCheckpoint {
  code: string;
  name: string;
  currency: string;
  timezone: string;
  sequence: number;
  journeyId: string;
  ceiling: number;
  impressions: number;
  version: number;
  channel: string;
  batchSize: number;
  status: SeasonalModelCheckpointStatus;

  constructor(
    code: string,
    name: string,
    currency: string,
    timezone: string,
    sequence: number,
    journeyId: string,
    ceiling: number,
    impressions: number,
    version: number,
    channel: string,
    batchSize: number,
    status: SeasonalModelCheckpointStatus,
  ) {
    this.code = code;
    this.name = name;
    this.currency = currency;
    this.timezone = timezone;
    this.sequence = sequence;
    this.journeyId = journeyId;
    this.ceiling = ceiling;
    this.impressions = impressions;
    this.version = version;
    this.channel = channel;
    this.batchSize = batchSize;
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

  canMoveTo(next: SeasonalModelCheckpointStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running";
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

  moveTo(next: SeasonalModelCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal model checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  netExposure(): number {
    return Math.round((this.ceiling - this.batchSize) * 100) / 100;
  }

  copy(): SeasonalModelCheckpoint {
    return new SeasonalModelCheckpoint(
      this.code,
      this.name,
      this.currency,
      this.timezone,
      this.sequence,
      this.journeyId,
      this.ceiling,
      this.impressions,
      this.version,
      this.channel,
      this.batchSize,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a seasonal model checkpoint in status new. */
export function newSeasonalModelCheckpoint(code: string, name: string): SeasonalModelCheckpoint {
  return new SeasonalModelCheckpoint(code, name, "", "", 0, "", 0, 0, 0, "", 0, "new");
}
