import * as text from "../../../../kit/text.js";

/** Where a manual retention mapping is in its life cycle. */
export type ManualRetentionMappingStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A manual retention mapping as the retention team keeps it. */
export class ManualRetentionMapping {
  code: string;
  title: string;
  attributes: Map<string, string>;
  source: string;
  floorValue: number;
  cost: number;
  margin: number;
  status: ManualRetentionMappingStatus;

  constructor(
    code: string,
    title: string,
    attributes: Map<string, string>,
    source: string,
    floorValue: number,
    cost: number,
    margin: number,
    status: ManualRetentionMappingStatus,
  ) {
    this.code = code;
    this.title = title;
    this.attributes = attributes;
    this.source = source;
    this.floorValue = floorValue;
    this.cost = cost;
    this.margin = margin;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: ManualRetentionMappingStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming";
      case "warming":
        return next === "ready" || next === "draining";
      case "ready":
        return next === "stopped";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: ManualRetentionMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual retention mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  adjustedVolume(): number {
    return Math.round(this.floorValue * this.cost * 100) / 100;
  }

  copy(): ManualRetentionMapping {
    return new ManualRetentionMapping(
      this.code,
      this.title,
      this.attributes,
      this.source,
      this.floorValue,
      this.cost,
      this.margin,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a manual retention mapping in status idle. */
export function newManualRetentionMapping(code: string, title: string): ManualRetentionMapping {
  return new ManualRetentionMapping(code, title, new Map<string, string>(), "", 0, 0, 0, "idle");
}
