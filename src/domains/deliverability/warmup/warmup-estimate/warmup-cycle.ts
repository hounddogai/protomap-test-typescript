import * as text from "../../../../kit/text.js";

/** Where a warmup cycle is in its life cycle. */
export type WarmupCycleStatus = "created" | "validated" | "published" | "retired";

/** One warmup cycle, with what the planners need to act on it. */
export class WarmupCycle {
  code: string;
  label: string;
  source: string;
  tags: string[];
  batchSize: number;
  frequencyCap: number;
  ratio: number;
  audienceId: string;
  journeyId: string;
  floorValue: number;
  approved: boolean;
  status: WarmupCycleStatus;

  constructor(
    code: string,
    label: string,
    source: string,
    tags: string[],
    batchSize: number,
    frequencyCap: number,
    ratio: number,
    audienceId: string,
    journeyId: string,
    floorValue: number,
    approved: boolean,
    status: WarmupCycleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.source = source;
    this.tags = tags;
    this.batchSize = batchSize;
    this.frequencyCap = frequencyCap;
    this.ratio = ratio;
    this.audienceId = audienceId;
    this.journeyId = journeyId;
    this.floorValue = floorValue;
    this.approved = approved;
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

  canMoveTo(next: WarmupCycleStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated" || next === "published";
      case "validated":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: WarmupCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`warmup cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  effectiveValue(): number {
    return Math.round(this.floorValue * this.batchSize * 100) / 100;
  }

  copy(): WarmupCycle {
    return new WarmupCycle(
      this.code,
      this.label,
      this.source,
      this.tags,
      this.batchSize,
      this.frequencyCap,
      this.ratio,
      this.audienceId,
      this.journeyId,
      this.floorValue,
      this.approved,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a warmup cycle in status created. */
export function newWarmupCycle(code: string, label: string): WarmupCycle {
  return new WarmupCycle(code, label, "", [], 0, 0, 0, "", "", 0, false, "created");
}
