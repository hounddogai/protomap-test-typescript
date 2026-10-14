import * as text from "../../../../kit/text.js";

/** Where a wait mapping is in its life cycle. */
export type WaitMappingStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a wait mapping and its current status. */
export class WaitMapping {
  code: string;
  name: string;
  floorValue: number;
  margin: number;
  priority: number;
  status: WaitMappingStatus;

  constructor(
    code: string,
    name: string,
    floorValue: number,
    margin: number,
    priority: number,
    status: WaitMappingStatus,
  ) {
    this.code = code;
    this.name = name;
    this.floorValue = floorValue;
    this.margin = margin;
    this.priority = priority;
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

  canMoveTo(next: WaitMappingStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
          case "reopened":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: WaitMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`wait mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  netValue(): number {
    return Math.round(this.floorValue * this.priority * 100) / 100;
  }

  copy(): WaitMapping {
    return new WaitMapping(this.code, this.name, this.floorValue, this.margin, this.priority, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a wait mapping in status open. */
export function newWaitMapping(code: string, name: string): WaitMapping {
  return new WaitMapping(code, name, 0, 0, 0, "open");
}
