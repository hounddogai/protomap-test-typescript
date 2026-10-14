import * as text from "../../../../kit/text.js";

/** Where a path slot is in its life cycle. */
export type PathSlotStatus = "created" | "validated" | "published" | "retired";

/** A path slot. Its code is unique within a tenant. */
export class PathSlot {
  code: string;
  name: string;
  score: number;
  visible: boolean;
  openRate: number;
  status: PathSlotStatus;

  constructor(
    code: string,
    name: string,
    score: number,
    visible: boolean,
    openRate: number,
    status: PathSlotStatus,
  ) {
    this.code = code;
    this.name = name;
    this.score = score;
    this.visible = visible;
    this.openRate = openRate;
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

  canMoveTo(next: PathSlotStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
            return true;
        }
        return false;
      case "validated":
        return next === "retired";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PathSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`path slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  effectiveValue(): number {
    return Math.round((this.openRate + this.score) * 100) / 100;
  }

  copy(): PathSlot {
    return new PathSlot(this.code, this.name, this.score, this.visible, this.openRate, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a path slot in status created. */
export function newPathSlot(code: string, name: string): PathSlot {
  return new PathSlot(code, name, 0, false, 0, "created");
}
