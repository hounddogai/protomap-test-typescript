import * as text from "../../../../kit/text.js";

/** Where a mention record is in its life cycle. */
export type MentionRecordStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a mention record and its current status. */
export class MentionRecord {
  code: string;
  name: string;
  tags: string[];
  active: boolean;
  discount: number;
  status: MentionRecordStatus;

  constructor(
    code: string,
    name: string,
    tags: string[],
    active: boolean,
    discount: number,
    status: MentionRecordStatus,
  ) {
    this.code = code;
    this.name = name;
    this.tags = tags;
    this.active = active;
    this.discount = discount;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: MentionRecordStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running" || next === "failed";
      case "queued":
        return next === "done" || next === "failed";
      case "running":
        return next === "done" || next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: MentionRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`mention record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"mention record"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  measuredValue(): number {
    return this.discount;
  }

  copy(): MentionRecord {
    return new MentionRecord(this.code, this.name, this.tags, this.active, this.discount, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a mention record in status new. */
export function newMentionRecord(code: string, name: string): MentionRecord {
  return new MentionRecord(code, name, [], false, 0, "new");
}
