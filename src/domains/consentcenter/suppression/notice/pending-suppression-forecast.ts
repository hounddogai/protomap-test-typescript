import * as text from "../../../../kit/text.js";

/** Where a pending suppression forecast is in its life cycle. */
export type PendingSuppressionForecastStatus = "created" | "validated" | "published" | "retired";

/** A pending suppression forecast. Its code is unique within a tenant. */
export class PendingSuppressionForecast {
  code: string;
  title: string;
  unit: string;
  label: string;
  ceiling: number;
  region: string;
  channel: string;
  status: PendingSuppressionForecastStatus;

  constructor(
    code: string,
    title: string,
    unit: string,
    label: string,
    ceiling: number,
    region: string,
    channel: string,
    status: PendingSuppressionForecastStatus,
  ) {
    this.code = code;
    this.title = title;
    this.unit = unit;
    this.label = label;
    this.ceiling = ceiling;
    this.region = region;
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

  canMoveTo(next: PendingSuppressionForecastStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "retired":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: PendingSuppressionForecastStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending suppression forecast ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.title}`;
  }

  measuredValue(): number {
    return this.ceiling;
  }

  copy(): PendingSuppressionForecast {
    return new PendingSuppressionForecast(
      this.code,
      this.title,
      this.unit,
      this.label,
      this.ceiling,
      this.region,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a pending suppression forecast in status created. */
export function newPendingSuppressionForecast(code: string, title: string): PendingSuppressionForecast {
  return new PendingSuppressionForecast(code, title, "", "", 0, "", "", "created");
}
