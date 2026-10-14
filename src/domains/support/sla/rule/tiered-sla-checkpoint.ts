import * as text from "../../../../kit/text.js";

/** Where a tiered sla checkpoint is in its life cycle. */
export type TieredSlaCheckpointStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A tiered sla checkpoint as the sla team keeps it. */
export class TieredSlaCheckpoint {
  code: string;
  title: string;
  tags: string[];
  rate: number;
  openRate: number;
  status: TieredSlaCheckpointStatus;

  constructor(
    code: string,
    title: string,
    tags: string[],
    rate: number,
    openRate: number,
    status: TieredSlaCheckpointStatus,
  ) {
    this.code = code;
    this.title = title;
    this.tags = tags;
    this.rate = rate;
    this.openRate = openRate;
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

  canMoveTo(next: TieredSlaCheckpointStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "completed" || next === "cancelled";
      case "scheduled":
        return next === "in_progress";
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: TieredSlaCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered sla checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  effectiveLoad(): number {
    return Math.round(this.rate * this.openRate * 100) / 100;
  }

  copy(): TieredSlaCheckpoint {
    return new TieredSlaCheckpoint(this.code, this.title, this.tags, this.rate, this.openRate, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a tiered sla checkpoint in status planned. */
export function newTieredSlaCheckpoint(code: string, title: string): TieredSlaCheckpoint {
  return new TieredSlaCheckpoint(code, title, [], 0, 0, "planned");
}
