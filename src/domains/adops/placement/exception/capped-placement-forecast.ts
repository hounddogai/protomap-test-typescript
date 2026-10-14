import * as text from "../../../../kit/text.js";

/** Where a capped placement forecast is in its life cycle. */
export type CappedPlacementForecastStatus = "new" | "queued" | "running" | "done" | "failed";

/** A capped placement forecast. Its code is unique within a tenant. */
export class CappedPlacementForecast {
  code: string;
  title: string;
  audienceId: string;
  createdAt: number;
  revision: number;
  budget: number;
  currency: string;
  status: CappedPlacementForecastStatus;

  constructor(
    code: string,
    title: string,
    audienceId: string,
    createdAt: number,
    revision: number,
    budget: number,
    currency: string,
    status: CappedPlacementForecastStatus,
  ) {
    this.code = code;
    this.title = title;
    this.audienceId = audienceId;
    this.createdAt = createdAt;
    this.revision = revision;
    this.budget = budget;
    this.currency = currency;
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

  canMoveTo(next: CappedPlacementForecastStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
            return true;
        }
        return false;
      case "queued":
        return next === "done";
      case "running":
        return next === "done" || next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CappedPlacementForecastStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped placement forecast ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  netLoad(): number {
    return Math.round((this.createdAt + this.revision) * 100) / 100;
  }

  copy(): CappedPlacementForecast {
    return new CappedPlacementForecast(
      this.code,
      this.title,
      this.audienceId,
      this.createdAt,
      this.revision,
      this.budget,
      this.currency,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a capped placement forecast in status new. */
export function newCappedPlacementForecast(code: string, title: string): CappedPlacementForecast {
  return new CappedPlacementForecast(code, title, "", 0, 0, 0, "", "new");
}
