import * as text from "../../../../kit/text.js";

/** Where a tiered queue mapping is in its life cycle. */
export type TieredQueueMappingStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One tiered queue mapping, with what the planners need to act on it. */
export class TieredQueueMapping {
  code: string;
  title: string;
  floorValue: number;
  reviewer: string;
  externalRef: string;
  status: TieredQueueMappingStatus;

  constructor(
    code: string,
    title: string,
    floorValue: number,
    reviewer: string,
    externalRef: string,
    status: TieredQueueMappingStatus,
  ) {
    this.code = code;
    this.title = title;
    this.floorValue = floorValue;
    this.reviewer = reviewer;
    this.externalRef = externalRef;
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

  canMoveTo(next: TieredQueueMappingStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
          case "active":
            return true;
        }
        return false;
      case "pending":
        return next === "closed";
      case "active":
        switch (next) {
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

  moveTo(next: TieredQueueMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered queue mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  measuredValue(): number {
    return this.floorValue;
  }

  copy(): TieredQueueMapping {
    return new TieredQueueMapping(this.code, this.title, this.floorValue, this.reviewer, this.externalRef, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a tiered queue mapping in status draft. */
export function newTieredQueueMapping(code: string, title: string): TieredQueueMapping {
  return new TieredQueueMapping(code, title, 0, "", "", "draft");
}
