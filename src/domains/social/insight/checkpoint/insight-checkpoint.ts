/**
 * The insight checkpoint records of social's insight work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a insight checkpoint is in its life cycle. */
export type InsightCheckpointStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One insight checkpoint, with what the planners need to act on it. */
export class InsightCheckpoint {
  code: string;
  name: string;
  segment: string;
  rate: number;
  version: number;
  variant: string;
  impressions: number;
  score: number;
  archived: boolean;
  status: InsightCheckpointStatus;

  constructor(
    code: string,
    name: string,
    segment: string,
    rate: number,
    version: number,
    variant: string,
    impressions: number,
    score: number,
    archived: boolean,
    status: InsightCheckpointStatus,
  ) {
    this.code = code;
    this.name = name;
    this.segment = segment;
    this.rate = rate;
    this.version = version;
    this.variant = variant;
    this.impressions = impressions;
    this.score = score;
    this.archived = archived;
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

  canMoveTo(next: InsightCheckpointStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
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

  moveTo(next: InsightCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`insight checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${"insight checkpoint"} ${this.code}`;
  }

  projectedLoad(): number {
    return Math.round((this.impressions - this.rate) * 100) / 100;
  }

  copy(): InsightCheckpoint {
    return new InsightCheckpoint(
      this.code,
      this.name,
      this.segment,
      this.rate,
      this.version,
      this.variant,
      this.impressions,
      this.score,
      this.archived,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a insight checkpoint in status planned. */
export function newInsightCheckpoint(code: string, name: string): InsightCheckpoint {
  return new InsightCheckpoint(code, name, "", 0, 0, "", 0, 0, false, "planned");
}
