import * as text from "../../../../kit/text.js";

/** Where a post record is in its life cycle. */
export type PostRecordStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A post record as the post team keeps it. */
export class PostRecord {
  code: string;
  label: string;
  quantity: number;
  version: number;
  active: boolean;
  minimum: number;
  status: PostRecordStatus;

  constructor(
    code: string,
    label: string,
    quantity: number,
    version: number,
    active: boolean,
    minimum: number,
    status: PostRecordStatus,
  ) {
    this.code = code;
    this.label = label;
    this.quantity = quantity;
    this.version = version;
    this.active = active;
    this.minimum = minimum;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: PostRecordStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "resolved";
      case "in_review":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: PostRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`post record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  netExposure(): number {
    return Math.round((this.version + this.quantity) * 100) / 100;
  }

  copy(): PostRecord {
    return new PostRecord(this.code, this.label, this.quantity, this.version, this.active, this.minimum, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a post record in status open. */
export function newPostRecord(code: string, label: string): PostRecord {
  return new PostRecord(code, label, 0, 0, false, 0, "open");
}
