import * as text from "../../../../kit/text.js";

/** Where a primary pacing metric is in its life cycle. */
export type PrimaryPacingMetricStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a primary pacing metric and its current status. */
export class PrimaryPacingMetric {
  code: string;
  name: string;
  rate: number;
  startsAt: number;
  discount: number;
  tags: string[];
  ratio: number;
  ceiling: number;
  locale: string;
  status: PrimaryPacingMetricStatus;

  constructor(
    code: string,
    name: string,
    rate: number,
    startsAt: number,
    discount: number,
    tags: string[],
    ratio: number,
    ceiling: number,
    locale: string,
    status: PrimaryPacingMetricStatus,
  ) {
    this.code = code;
    this.name = name;
    this.rate = rate;
    this.startsAt = startsAt;
    this.discount = discount;
    this.tags = tags;
    this.ratio = ratio;
    this.ceiling = ceiling;
    this.locale = locale;
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

  canMoveTo(next: PrimaryPacingMetricStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "cancelled";
      case "scheduled":
        switch (next) {
          case "in_progress":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PrimaryPacingMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary pacing metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  netVolume(): number {
    return Math.round((this.rate + this.ceiling) * 100) / 100;
  }

  copy(): PrimaryPacingMetric {
    return new PrimaryPacingMetric(
      this.code,
      this.name,
      this.rate,
      this.startsAt,
      this.discount,
      this.tags,
      this.ratio,
      this.ceiling,
      this.locale,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a primary pacing metric in status planned. */
export function newPrimaryPacingMetric(code: string, name: string): PrimaryPacingMetric {
  return new PrimaryPacingMetric(code, name, 0, 0, 0, [], 0, 0, "", "planned");
}
