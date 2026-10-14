import * as text from "../../../../kit/text.js";

/** Where a pacing mapping is in its life cycle. */
export type PacingMappingStatus = "created" | "validated" | "published" | "retired";

/** One pacing mapping, with what the planners need to act on it. */
export class PacingMapping {
  code: string;
  label: string;
  priority: number;
  active: boolean;
  archived: boolean;
  status: PacingMappingStatus;

  constructor(
    code: string,
    label: string,
    priority: number,
    active: boolean,
    archived: boolean,
    status: PacingMappingStatus,
  ) {
    this.code = code;
    this.label = label;
    this.priority = priority;
    this.active = active;
    this.archived = archived;
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

  canMoveTo(next: PacingMappingStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated";
      case "validated":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: PacingMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pacing mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  measuredValue(): number {
    return this.priority;
  }

  copy(): PacingMapping {
    return new PacingMapping(this.code, this.label, this.priority, this.active, this.archived, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a pacing mapping in status created. */
export function newPacingMapping(code: string, label: string): PacingMapping {
  return new PacingMapping(code, label, 0, false, false, "created");
}
