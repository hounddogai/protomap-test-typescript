import * as text from "../../../../kit/text.js";

/** Where a opt out adjustment is in its life cycle. */
export type OptOutAdjustmentStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A opt out adjustment as the opt out team keeps it. */
export class OptOutAdjustment {
  code: string;
  name: string;
  pinned: boolean;
  score: number;
  attributes: Map<string, string>;
  status: OptOutAdjustmentStatus;

  constructor(
    code: string,
    name: string,
    pinned: boolean,
    score: number,
    attributes: Map<string, string>,
    status: OptOutAdjustmentStatus,
  ) {
    this.code = code;
    this.name = name;
    this.pinned = pinned;
    this.score = score;
    this.attributes = attributes;
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

  canMoveTo(next: OptOutAdjustmentStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "resolved":
          case "reopened":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: OptOutAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`opt out adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  measuredValue(): number {
    return this.score;
  }

  copy(): OptOutAdjustment {
    return new OptOutAdjustment(this.code, this.name, this.pinned, this.score, this.attributes, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a opt out adjustment in status open. */
export function newOptOutAdjustment(code: string, name: string): OptOutAdjustment {
  return new OptOutAdjustment(code, name, false, 0, new Map<string, string>(), "open");
}
