import * as text from "../../../../kit/text.js";

/** Where a rolling creative summary is in its life cycle. */
export type RollingCreativeSummaryStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One rolling creative summary, with what the planners need to act on it. */
export class RollingCreativeSummary {
  code: string;
  title: string;
  amount: number;
  minimum: number;
  timezone: string;
  visible: boolean;
  notes: string;
  impressions: number;
  status: RollingCreativeSummaryStatus;

  constructor(
    code: string,
    title: string,
    amount: number,
    minimum: number,
    timezone: string,
    visible: boolean,
    notes: string,
    impressions: number,
    status: RollingCreativeSummaryStatus,
  ) {
    this.code = code;
    this.title = title;
    this.amount = amount;
    this.minimum = minimum;
    this.timezone = timezone;
    this.visible = visible;
    this.notes = notes;
    this.impressions = impressions;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: RollingCreativeSummaryStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled" || next === "completed";
      case "scheduled":
        return next === "completed" || next === "cancelled";
      case "in_progress":
        return next === "completed";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: RollingCreativeSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling creative summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  netVolume(): number {
    return Math.round(this.minimum * this.amount * 100) / 100;
  }

  copy(): RollingCreativeSummary {
    return new RollingCreativeSummary(
      this.code,
      this.title,
      this.amount,
      this.minimum,
      this.timezone,
      this.visible,
      this.notes,
      this.impressions,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a rolling creative summary in status planned. */
export function newRollingCreativeSummary(code: string, title: string): RollingCreativeSummary {
  return new RollingCreativeSummary(code, title, 0, 0, "", false, "", 0, "planned");
}
