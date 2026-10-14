import * as text from "../../../../kit/text.js";

/** Where a queue mapping is in its life cycle. */
export type QueueMappingStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One queue mapping, with what the planners need to act on it. */
export class QueueMapping {
  code: string;
  label: string;
  budget: number;
  category: string;
  name: string;
  checksum: string;
  score: number;
  status: QueueMappingStatus;

  constructor(
    code: string,
    label: string,
    budget: number,
    category: string,
    name: string,
    checksum: string,
    score: number,
    status: QueueMappingStatus,
  ) {
    this.code = code;
    this.label = label;
    this.budget = budget;
    this.category = category;
    this.name = name;
    this.checksum = checksum;
    this.score = score;
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

  canMoveTo(next: QueueMappingStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
            return true;
        }
        return false;
      case "pending":
        return next === "closed";
      case "active":
        switch (next) {
          case "suspended":
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

  moveTo(next: QueueMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`queue mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  netExposure(): number {
    return Math.round((this.budget + this.score) * 100) / 100;
  }

  copy(): QueueMapping {
    return new QueueMapping(
      this.code,
      this.label,
      this.budget,
      this.category,
      this.name,
      this.checksum,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a queue mapping in status draft. */
export function newQueueMapping(code: string, label: string): QueueMapping {
  return new QueueMapping(code, label, 0, "", "", "", 0, "draft");
}
