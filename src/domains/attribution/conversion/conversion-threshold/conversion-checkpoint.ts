import * as text from "../../../../kit/text.js";

/** Where a conversion checkpoint is in its life cycle. */
export type ConversionCheckpointStatus = "new" | "queued" | "running" | "done" | "failed";

/** One conversion checkpoint, with what the planners need to act on it. */
export class ConversionCheckpoint {
  code: string;
  title: string;
  maximum: number;
  cost: number;
  windowDays: number;
  threshold: number;
  source: string;
  locale: string;
  createdAt: number;
  status: ConversionCheckpointStatus;

  constructor(
    code: string,
    title: string,
    maximum: number,
    cost: number,
    windowDays: number,
    threshold: number,
    source: string,
    locale: string,
    createdAt: number,
    status: ConversionCheckpointStatus,
  ) {
    this.code = code;
    this.title = title;
    this.maximum = maximum;
    this.cost = cost;
    this.windowDays = windowDays;
    this.threshold = threshold;
    this.source = source;
    this.locale = locale;
    this.createdAt = createdAt;
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

  canMoveTo(next: ConversionCheckpointStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "failed";
      case "queued":
        return next === "done" || next === "failed";
      case "running":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ConversionCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`conversion checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  projectedLoad(): number {
    return Math.round((this.windowDays - this.maximum) * 100) / 100;
  }

  copy(): ConversionCheckpoint {
    return new ConversionCheckpoint(
      this.code,
      this.title,
      this.maximum,
      this.cost,
      this.windowDays,
      this.threshold,
      this.source,
      this.locale,
      this.createdAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a conversion checkpoint in status new. */
export function newConversionCheckpoint(code: string, title: string): ConversionCheckpoint {
  return new ConversionCheckpoint(code, title, 0, 0, 0, 0, "", "", 0, "new");
}
