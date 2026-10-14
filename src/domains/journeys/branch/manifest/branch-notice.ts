import * as text from "../../../../kit/text.js";

/** Where a branch notice is in its life cycle. */
export type BranchNoticeStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a branch notice and its current status. */
export class BranchNotice {
  code: string;
  name: string;
  tags: string[];
  version: number;
  batchSize: number;
  approved: boolean;
  updatedAt: number;
  campaignRef: string;
  archived: boolean;
  status: BranchNoticeStatus;

  constructor(
    code: string,
    name: string,
    tags: string[],
    version: number,
    batchSize: number,
    approved: boolean,
    updatedAt: number,
    campaignRef: string,
    archived: boolean,
    status: BranchNoticeStatus,
  ) {
    this.code = code;
    this.name = name;
    this.tags = tags;
    this.version = version;
    this.batchSize = batchSize;
    this.approved = approved;
    this.updatedAt = updatedAt;
    this.campaignRef = campaignRef;
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

  canMoveTo(next: BranchNoticeStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
          case "in_progress":
            return true;
        }
        return false;
      case "scheduled":
        return next === "completed" || next === "cancelled";
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BranchNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`branch notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  weightedValue(): number {
    return Math.round((this.updatedAt - this.version) * 100) / 100;
  }

  copy(): BranchNotice {
    return new BranchNotice(
      this.code,
      this.name,
      this.tags,
      this.version,
      this.batchSize,
      this.approved,
      this.updatedAt,
      this.campaignRef,
      this.archived,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a branch notice in status planned. */
export function newBranchNotice(code: string, name: string): BranchNotice {
  return new BranchNotice(code, name, [], 0, 0, false, 0, "", false, "planned");
}
