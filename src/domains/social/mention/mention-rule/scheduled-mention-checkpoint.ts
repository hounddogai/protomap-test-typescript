import * as text from "../../../../kit/text.js";

/** Where a scheduled mention checkpoint is in its life cycle. */
export type ScheduledMentionCheckpointStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A scheduled mention checkpoint as the mention team keeps it. */
export class ScheduledMentionCheckpoint {
  code: string;
  name: string;
  visible: boolean;
  description: string;
  tags: string[];
  amount: number;
  status: ScheduledMentionCheckpointStatus;

  constructor(
    code: string,
    name: string,
    visible: boolean,
    description: string,
    tags: string[],
    amount: number,
    status: ScheduledMentionCheckpointStatus,
  ) {
    this.code = code;
    this.name = name;
    this.visible = visible;
    this.description = description;
    this.tags = tags;
    this.amount = amount;
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

  canMoveTo(next: ScheduledMentionCheckpointStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "pending":
        return next === "closed";
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: ScheduledMentionCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled mention checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  measuredValue(): number {
    return this.amount;
  }

  copy(): ScheduledMentionCheckpoint {
    return new ScheduledMentionCheckpoint(
      this.code,
      this.name,
      this.visible,
      this.description,
      this.tags,
      this.amount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a scheduled mention checkpoint in status draft. */
export function newScheduledMentionCheckpoint(code: string, name: string): ScheduledMentionCheckpoint {
  return new ScheduledMentionCheckpoint(code, name, false, "", [], 0, "draft");
}
