import * as text from "../../../../kit/text.js";

/** Where a reply assignment is in its life cycle. */
export type ReplyAssignmentStatus = "created" | "validated" | "published" | "retired";

/** The record of a reply assignment and its current status. */
export class ReplyAssignment {
  code: string;
  name: string;
  audienceId: string;
  maximum: number;
  sequence: number;
  title: string;
  sendAt: number;
  label: string;
  batchSize: number;
  score: number;
  status: ReplyAssignmentStatus;

  constructor(
    code: string,
    name: string,
    audienceId: string,
    maximum: number,
    sequence: number,
    title: string,
    sendAt: number,
    label: string,
    batchSize: number,
    score: number,
    status: ReplyAssignmentStatus,
  ) {
    this.code = code;
    this.name = name;
    this.audienceId = audienceId;
    this.maximum = maximum;
    this.sequence = sequence;
    this.title = title;
    this.sendAt = sendAt;
    this.label = label;
    this.batchSize = batchSize;
    this.score = score;
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

  canMoveTo(next: ReplyAssignmentStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated" || next === "published";
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: ReplyAssignmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reply assignment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.name}]`;
  }

  adjustedValue(): number {
    return Math.round((this.sendAt + this.maximum) * 100) / 100;
  }

  copy(): ReplyAssignment {
    return new ReplyAssignment(
      this.code,
      this.name,
      this.audienceId,
      this.maximum,
      this.sequence,
      this.title,
      this.sendAt,
      this.label,
      this.batchSize,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a reply assignment in status created. */
export function newReplyAssignment(code: string, name: string): ReplyAssignment {
  return new ReplyAssignment(code, name, "", 0, 0, "", 0, "", 0, 0, "created");
}
