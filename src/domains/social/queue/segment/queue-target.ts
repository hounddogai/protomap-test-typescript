import * as text from "../../../../kit/text.js";

/** Where a queue target is in its life cycle. */
export type QueueTargetStatus = "created" | "validated" | "published" | "retired";

/** One queue target, with what the planners need to act on it. */
export class QueueTarget {
  code: string;
  name: string;
  attributes: Map<string, string>;
  approved: boolean;
  sendAt: number;
  reviewer: string;
  status: QueueTargetStatus;

  constructor(
    code: string,
    name: string,
    attributes: Map<string, string>,
    approved: boolean,
    sendAt: number,
    reviewer: string,
    status: QueueTargetStatus,
  ) {
    this.code = code;
    this.name = name;
    this.attributes = attributes;
    this.approved = approved;
    this.sendAt = sendAt;
    this.reviewer = reviewer;
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

  canMoveTo(next: QueueTargetStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "published":
            return true;
        }
        return false;
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: QueueTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`queue target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"queue target"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  measuredValue(): number {
    return this.sendAt;
  }

  copy(): QueueTarget {
    return new QueueTarget(
      this.code,
      this.name,
      this.attributes,
      this.approved,
      this.sendAt,
      this.reviewer,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a queue target in status created. */
export function newQueueTarget(code: string, name: string): QueueTarget {
  return new QueueTarget(code, name, new Map<string, string>(), false, 0, "", "created");
}
