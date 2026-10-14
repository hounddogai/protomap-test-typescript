import * as text from "../../../../kit/text.js";

/** Where a placement summary is in its life cycle. */
export type PlacementSummaryStatus = "new" | "queued" | "running" | "done" | "failed";

/** A placement summary as the placement team keeps it. */
export class PlacementSummary {
  code: string;
  label: string;
  channel: string;
  category: string;
  weight: number;
  archived: boolean;
  endsAt: number;
  summary: string;
  unit: string;
  status: PlacementSummaryStatus;

  constructor(
    code: string,
    label: string,
    channel: string,
    category: string,
    weight: number,
    archived: boolean,
    endsAt: number,
    summary: string,
    unit: string,
    status: PlacementSummaryStatus,
  ) {
    this.code = code;
    this.label = label;
    this.channel = channel;
    this.category = category;
    this.weight = weight;
    this.archived = archived;
    this.endsAt = endsAt;
    this.summary = summary;
    this.unit = unit;
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

  canMoveTo(next: PlacementSummaryStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "running":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "failed":
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

  moveTo(next: PlacementSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`placement summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  effectiveValue(): number {
    return Math.round((this.weight + this.endsAt) * 100) / 100;
  }

  copy(): PlacementSummary {
    return new PlacementSummary(
      this.code,
      this.label,
      this.channel,
      this.category,
      this.weight,
      this.archived,
      this.endsAt,
      this.summary,
      this.unit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a placement summary in status new. */
export function newPlacementSummary(code: string, label: string): PlacementSummary {
  return new PlacementSummary(code, label, "", "", 0, false, 0, "", "", "new");
}
