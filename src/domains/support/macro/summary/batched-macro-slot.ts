import * as text from "../../../../kit/text.js";

/** Where a batched macro slot is in its life cycle. */
export type BatchedMacroSlotStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One batched macro slot, with what the planners need to act on it. */
export class BatchedMacroSlot {
  code: string;
  name: string;
  archived: boolean;
  notes: string;
  tags: string[];
  campaignRef: string;
  reviewer: string;
  source: string;
  description: string;
  channel: string;
  threshold: number;
  status: BatchedMacroSlotStatus;

  constructor(
    code: string,
    name: string,
    archived: boolean,
    notes: string,
    tags: string[],
    campaignRef: string,
    reviewer: string,
    source: string,
    description: string,
    channel: string,
    threshold: number,
    status: BatchedMacroSlotStatus,
  ) {
    this.code = code;
    this.name = name;
    this.archived = archived;
    this.notes = notes;
    this.tags = tags;
    this.campaignRef = campaignRef;
    this.reviewer = reviewer;
    this.source = source;
    this.description = description;
    this.channel = channel;
    this.threshold = threshold;
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

  canMoveTo(next: BatchedMacroSlotStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "active";
      case "pending":
        return next === "active";
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BatchedMacroSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched macro slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  measuredValue(): number {
    return this.threshold;
  }

  copy(): BatchedMacroSlot {
    return new BatchedMacroSlot(
      this.code,
      this.name,
      this.archived,
      this.notes,
      this.tags,
      this.campaignRef,
      this.reviewer,
      this.source,
      this.description,
      this.channel,
      this.threshold,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a batched macro slot in status draft. */
export function newBatchedMacroSlot(code: string, name: string): BatchedMacroSlot {
  return new BatchedMacroSlot(code, name, false, "", [], "", "", "", "", "", 0, "draft");
}
