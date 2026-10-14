import * as text from "../../../../kit/text.js";

/** Where a seasonal insight batch is in its life cycle. */
export type SeasonalInsightBatchStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a seasonal insight batch and its current status. */
export class SeasonalInsightBatch {
  code: string;
  name: string;
  endsAt: number;
  margin: number;
  title: string;
  priority: number;
  pinned: boolean;
  maximum: number;
  limit: number;
  visible: boolean;
  status: SeasonalInsightBatchStatus;

  constructor(
    code: string,
    name: string,
    endsAt: number,
    margin: number,
    title: string,
    priority: number,
    pinned: boolean,
    maximum: number,
    limit: number,
    visible: boolean,
    status: SeasonalInsightBatchStatus,
  ) {
    this.code = code;
    this.name = name;
    this.endsAt = endsAt;
    this.margin = margin;
    this.title = title;
    this.priority = priority;
    this.pinned = pinned;
    this.maximum = maximum;
    this.limit = limit;
    this.visible = visible;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: SeasonalInsightBatchStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "closed";
      case "pending":
        return next === "suspended";
      case "active":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: SeasonalInsightBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal insight batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  weightedValue(): number {
    return Math.round((this.priority + this.endsAt) * 100) / 100;
  }

  copy(): SeasonalInsightBatch {
    return new SeasonalInsightBatch(
      this.code,
      this.name,
      this.endsAt,
      this.margin,
      this.title,
      this.priority,
      this.pinned,
      this.maximum,
      this.limit,
      this.visible,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a seasonal insight batch in status draft. */
export function newSeasonalInsightBatch(code: string, name: string): SeasonalInsightBatch {
  return new SeasonalInsightBatch(code, name, 0, 0, "", 0, false, 0, 0, false, "draft");
}
