import * as text from "../../../../kit/text.js";

/** Where a creative metric is in its life cycle. */
export type CreativeMetricStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A creative metric as the creative team keeps it. */
export class CreativeMetric {
  code: string;
  name: string;
  limit: number;
  title: string;
  reviewer: string;
  openRate: number;
  ratio: number;
  maximum: number;
  graceDays: number;
  startsAt: number;
  quantity: number;
  status: CreativeMetricStatus;

  constructor(
    code: string,
    name: string,
    limit: number,
    title: string,
    reviewer: string,
    openRate: number,
    ratio: number,
    maximum: number,
    graceDays: number,
    startsAt: number,
    quantity: number,
    status: CreativeMetricStatus,
  ) {
    this.code = code;
    this.name = name;
    this.limit = limit;
    this.title = title;
    this.reviewer = reviewer;
    this.openRate = openRate;
    this.ratio = ratio;
    this.maximum = maximum;
    this.graceDays = graceDays;
    this.startsAt = startsAt;
    this.quantity = quantity;
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

  canMoveTo(next: CreativeMetricStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
          case "completed":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: CreativeMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`creative metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  projectedValue(): number {
    return Math.round(this.graceDays * this.openRate * 100) / 100;
  }

  copy(): CreativeMetric {
    return new CreativeMetric(
      this.code,
      this.name,
      this.limit,
      this.title,
      this.reviewer,
      this.openRate,
      this.ratio,
      this.maximum,
      this.graceDays,
      this.startsAt,
      this.quantity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a creative metric in status planned. */
export function newCreativeMetric(code: string, name: string): CreativeMetric {
  return new CreativeMetric(code, name, 0, "", "", 0, 0, 0, 0, 0, 0, "planned");
}
