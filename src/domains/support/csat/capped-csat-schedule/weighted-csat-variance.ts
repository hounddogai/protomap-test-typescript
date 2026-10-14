import * as text from "../../../../kit/text.js";

/** Where a weighted csat variance is in its life cycle. */
export type WeightedCsatVarianceStatus = "new" | "queued" | "running" | "done" | "failed";

/** One weighted csat variance, with what the planners need to act on it. */
export class WeightedCsatVariance {
  code: string;
  name: string;
  startsAt: number;
  batchSize: number;
  revision: number;
  floorValue: number;
  conversionRate: number;
  audienceId: string;
  status: WeightedCsatVarianceStatus;

  constructor(
    code: string,
    name: string,
    startsAt: number,
    batchSize: number,
    revision: number,
    floorValue: number,
    conversionRate: number,
    audienceId: string,
    status: WeightedCsatVarianceStatus,
  ) {
    this.code = code;
    this.name = name;
    this.startsAt = startsAt;
    this.batchSize = batchSize;
    this.revision = revision;
    this.floorValue = floorValue;
    this.conversionRate = conversionRate;
    this.audienceId = audienceId;
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

  canMoveTo(next: WeightedCsatVarianceStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "running":
          case "done":
            return true;
        }
        return false;
      case "queued":
        return next === "running" || next === "done";
      case "running":
        return next === "done" || next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: WeightedCsatVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted csat variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  adjustedLoad(): number {
    return Math.round((this.conversionRate - this.startsAt) * 100) / 100;
  }

  copy(): WeightedCsatVariance {
    return new WeightedCsatVariance(
      this.code,
      this.name,
      this.startsAt,
      this.batchSize,
      this.revision,
      this.floorValue,
      this.conversionRate,
      this.audienceId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a weighted csat variance in status new. */
export function newWeightedCsatVariance(code: string, name: string): WeightedCsatVariance {
  return new WeightedCsatVariance(code, name, 0, 0, 0, 0, 0, "", "new");
}
