import * as text from "../../../../kit/text.js";

/** Where a placement group is in its life cycle. */
export type PlacementGroupStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A placement group as the placement team keeps it. */
export class PlacementGroup {
  code: string;
  label: string;
  tags: string[];
  source: string;
  journeyId: string;
  sequence: number;
  priority: number;
  weight: number;
  channel: string;
  limit: number;
  reviewer: string;
  status: PlacementGroupStatus;

  constructor(
    code: string,
    label: string,
    tags: string[],
    source: string,
    journeyId: string,
    sequence: number,
    priority: number,
    weight: number,
    channel: string,
    limit: number,
    reviewer: string,
    status: PlacementGroupStatus,
  ) {
    this.code = code;
    this.label = label;
    this.tags = tags;
    this.source = source;
    this.journeyId = journeyId;
    this.sequence = sequence;
    this.priority = priority;
    this.weight = weight;
    this.channel = channel;
    this.limit = limit;
    this.reviewer = reviewer;
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

  canMoveTo(next: PlacementGroupStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled";
      case "scheduled":
        return next === "completed";
      case "in_progress":
        return next === "completed";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PlacementGroupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`placement group ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  netLoad(): number {
    return Math.round((this.weight - this.sequence) * 100) / 100;
  }

  copy(): PlacementGroup {
    return new PlacementGroup(
      this.code,
      this.label,
      this.tags,
      this.source,
      this.journeyId,
      this.sequence,
      this.priority,
      this.weight,
      this.channel,
      this.limit,
      this.reviewer,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a placement group in status planned. */
export function newPlacementGroup(code: string, label: string): PlacementGroup {
  return new PlacementGroup(code, label, [], "", "", 0, 0, 0, "", 0, "", "planned");
}
