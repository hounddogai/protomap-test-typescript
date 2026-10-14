import * as text from "../../../../kit/text.js";

/** Where a batched retention segment is in its life cycle. */
export type BatchedRetentionSegmentStatus = "created" | "validated" | "published" | "retired";

/** One batched retention segment, with what the planners need to act on it. */
export class BatchedRetentionSegment {
  code: string;
  name: string;
  description: string;
  summary: string;
  category: string;
  approved: boolean;
  durationMinutes: number;
  margin: number;
  version: number;
  sendAt: number;
  status: BatchedRetentionSegmentStatus;

  constructor(
    code: string,
    name: string,
    description: string,
    summary: string,
    category: string,
    approved: boolean,
    durationMinutes: number,
    margin: number,
    version: number,
    sendAt: number,
    status: BatchedRetentionSegmentStatus,
  ) {
    this.code = code;
    this.name = name;
    this.description = description;
    this.summary = summary;
    this.category = category;
    this.approved = approved;
    this.durationMinutes = durationMinutes;
    this.margin = margin;
    this.version = version;
    this.sendAt = sendAt;
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

  canMoveTo(next: BatchedRetentionSegmentStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published" || next === "retired";
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: BatchedRetentionSegmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched retention segment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  effectiveExposure(): number {
    return Math.round(this.margin * this.version * 100) / 100;
  }

  copy(): BatchedRetentionSegment {
    return new BatchedRetentionSegment(
      this.code,
      this.name,
      this.description,
      this.summary,
      this.category,
      this.approved,
      this.durationMinutes,
      this.margin,
      this.version,
      this.sendAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a batched retention segment in status created. */
export function newBatchedRetentionSegment(code: string, name: string): BatchedRetentionSegment {
  return new BatchedRetentionSegment(code, name, "", "", "", false, 0, 0, 0, 0, "created");
}
