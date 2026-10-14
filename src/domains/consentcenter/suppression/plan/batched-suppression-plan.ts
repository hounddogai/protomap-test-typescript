import * as text from "../../../../kit/text.js";

/** Where a batched suppression plan is in its life cycle. */
export type BatchedSuppressionPlanStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A batched suppression plan. Its code is unique within a tenant. */
export class BatchedSuppressionPlan {
  code: string;
  name: string;
  description: string;
  region: string;
  floorValue: number;
  limit: number;
  pinned: boolean;
  title: string;
  audienceId: string;
  attributes: Map<string, string>;
  reviewer: string;
  status: BatchedSuppressionPlanStatus;

  constructor(
    code: string,
    name: string,
    description: string,
    region: string,
    floorValue: number,
    limit: number,
    pinned: boolean,
    title: string,
    audienceId: string,
    attributes: Map<string, string>,
    reviewer: string,
    status: BatchedSuppressionPlanStatus,
  ) {
    this.code = code;
    this.name = name;
    this.description = description;
    this.region = region;
    this.floorValue = floorValue;
    this.limit = limit;
    this.pinned = pinned;
    this.title = title;
    this.audienceId = audienceId;
    this.attributes = attributes;
    this.reviewer = reviewer;
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

  canMoveTo(next: BatchedSuppressionPlanStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BatchedSuppressionPlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched suppression plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"batched suppression plan"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  weightedExposure(): number {
    return Math.round(this.limit * this.floorValue * 100) / 100;
  }

  copy(): BatchedSuppressionPlan {
    return new BatchedSuppressionPlan(
      this.code,
      this.name,
      this.description,
      this.region,
      this.floorValue,
      this.limit,
      this.pinned,
      this.title,
      this.audienceId,
      this.attributes,
      this.reviewer,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a batched suppression plan in status idle. */
export function newBatchedSuppressionPlan(code: string, name: string): BatchedSuppressionPlan {
  return new BatchedSuppressionPlan(code, name, "", "", 0, 0, false, "", "", new Map<string, string>(), "", "idle");
}
