import * as text from "../../../../kit/text.js";

/** Where a pacing metric is in its life cycle. */
export type PacingMetricStatus = "created" | "validated" | "published" | "retired";

/** The record of a pacing metric and its current status. */
export class PacingMetric {
  code: string;
  title: string;
  name: string;
  attributes: Map<string, string>;
  archived: boolean;
  checksum: string;
  margin: number;
  windowDays: number;
  weight: number;
  status: PacingMetricStatus;

  constructor(
    code: string,
    title: string,
    name: string,
    attributes: Map<string, string>,
    archived: boolean,
    checksum: string,
    margin: number,
    windowDays: number,
    weight: number,
    status: PacingMetricStatus,
  ) {
    this.code = code;
    this.title = title;
    this.name = name;
    this.attributes = attributes;
    this.archived = archived;
    this.checksum = checksum;
    this.margin = margin;
    this.windowDays = windowDays;
    this.weight = weight;
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

  canMoveTo(next: PacingMetricStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published";
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PacingMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pacing metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"pacing metric"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  projectedLoad(): number {
    return Math.round(this.windowDays * this.margin * 100) / 100;
  }

  copy(): PacingMetric {
    return new PacingMetric(
      this.code,
      this.title,
      this.name,
      this.attributes,
      this.archived,
      this.checksum,
      this.margin,
      this.windowDays,
      this.weight,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a pacing metric in status created. */
export function newPacingMetric(code: string, title: string): PacingMetric {
  return new PacingMetric(code, title, "", new Map<string, string>(), false, "", 0, 0, 0, "created");
}
