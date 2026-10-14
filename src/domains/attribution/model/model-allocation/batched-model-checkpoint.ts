import * as text from "../../../../kit/text.js";

/** Where a batched model checkpoint is in its life cycle. */
export type BatchedModelCheckpointStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A batched model checkpoint as the model team keeps it. */
export class BatchedModelCheckpoint {
  code: string;
  name: string;
  description: string;
  audienceId: string;
  priority: number;
  reviewer: string;
  tags: string[];
  revision: number;
  impressions: number;
  pinned: boolean;
  status: BatchedModelCheckpointStatus;

  constructor(
    code: string,
    name: string,
    description: string,
    audienceId: string,
    priority: number,
    reviewer: string,
    tags: string[],
    revision: number,
    impressions: number,
    pinned: boolean,
    status: BatchedModelCheckpointStatus,
  ) {
    this.code = code;
    this.name = name;
    this.description = description;
    this.audienceId = audienceId;
    this.priority = priority;
    this.reviewer = reviewer;
    this.tags = tags;
    this.revision = revision;
    this.impressions = impressions;
    this.pinned = pinned;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: BatchedModelCheckpointStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "pending":
        return next === "closed";
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BatchedModelCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched model checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  effectiveLoad(): number {
    return Math.round(this.priority * this.impressions * 100) / 100;
  }

  copy(): BatchedModelCheckpoint {
    return new BatchedModelCheckpoint(
      this.code,
      this.name,
      this.description,
      this.audienceId,
      this.priority,
      this.reviewer,
      this.tags,
      this.revision,
      this.impressions,
      this.pinned,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a batched model checkpoint in status draft. */
export function newBatchedModelCheckpoint(code: string, name: string): BatchedModelCheckpoint {
  return new BatchedModelCheckpoint(code, name, "", "", 0, "", [], 0, 0, false, "draft");
}
