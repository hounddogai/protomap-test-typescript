import * as text from "../../../../kit/text.js";

/** Where a batched post profile is in its life cycle. */
export type BatchedPostProfileStatus = "created" | "validated" | "published" | "retired";

/** A batched post profile as the post team keeps it. */
export class BatchedPostProfile {
  code: string;
  title: string;
  floorValue: number;
  segment: string;
  tags: string[];
  label: string;
  bid: number;
  sequence: number;
  maximum: number;
  status: BatchedPostProfileStatus;

  constructor(
    code: string,
    title: string,
    floorValue: number,
    segment: string,
    tags: string[],
    label: string,
    bid: number,
    sequence: number,
    maximum: number,
    status: BatchedPostProfileStatus,
  ) {
    this.code = code;
    this.title = title;
    this.floorValue = floorValue;
    this.segment = segment;
    this.tags = tags;
    this.label = label;
    this.bid = bid;
    this.sequence = sequence;
    this.maximum = maximum;
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

  canMoveTo(next: BatchedPostProfileStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated" || next === "retired";
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: BatchedPostProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched post profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"batched post profile"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  weightedExposure(): number {
    return Math.round(this.maximum * this.bid * 100) / 100;
  }

  copy(): BatchedPostProfile {
    return new BatchedPostProfile(
      this.code,
      this.title,
      this.floorValue,
      this.segment,
      this.tags,
      this.label,
      this.bid,
      this.sequence,
      this.maximum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a batched post profile in status created. */
export function newBatchedPostProfile(code: string, title: string): BatchedPostProfile {
  return new BatchedPostProfile(code, title, 0, "", [], "", 0, 0, 0, "created");
}
