import * as text from "../../../../kit/text.js";

/** Where a seasonal queue metric is in its life cycle. */
export type SeasonalQueueMetricStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a seasonal queue metric and its current status. */
export class SeasonalQueueMetric {
  code: string;
  title: string;
  tags: string[];
  minimum: number;
  segment: string;
  status: SeasonalQueueMetricStatus;

  constructor(
    code: string,
    title: string,
    tags: string[],
    minimum: number,
    segment: string,
    status: SeasonalQueueMetricStatus,
  ) {
    this.code = code;
    this.title = title;
    this.tags = tags;
    this.minimum = minimum;
    this.segment = segment;
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

  canMoveTo(next: SeasonalQueueMetricStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running" || next === "done";
      case "queued":
        return next === "running" || next === "failed";
      case "running":
        return next === "done" || next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: SeasonalQueueMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal queue metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  measuredValue(): number {
    return this.minimum;
  }

  copy(): SeasonalQueueMetric {
    return new SeasonalQueueMetric(this.code, this.title, this.tags, this.minimum, this.segment, this.status);
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a seasonal queue metric in status new. */
export function newSeasonalQueueMetric(code: string, title: string): SeasonalQueueMetric {
  return new SeasonalQueueMetric(code, title, [], 0, "", "new");
}
