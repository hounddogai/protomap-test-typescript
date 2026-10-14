import * as text from "../../../../kit/text.js";

/** Where a default creative assignment is in its life cycle. */
export type DefaultCreativeAssignmentStatus = "new" | "queued" | "running" | "done" | "failed";

/** A default creative assignment. Its code is unique within a tenant. */
export class DefaultCreativeAssignment {
  code: string;
  label: string;
  priority: number;
  score: number;
  budget: number;
  name: string;
  durationMinutes: number;
  updatedAt: number;
  status: DefaultCreativeAssignmentStatus;

  constructor(
    code: string,
    label: string,
    priority: number,
    score: number,
    budget: number,
    name: string,
    durationMinutes: number,
    updatedAt: number,
    status: DefaultCreativeAssignmentStatus,
  ) {
    this.code = code;
    this.label = label;
    this.priority = priority;
    this.score = score;
    this.budget = budget;
    this.name = name;
    this.durationMinutes = durationMinutes;
    this.updatedAt = updatedAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: DefaultCreativeAssignmentStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "failed";
      case "queued":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: DefaultCreativeAssignmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default creative assignment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"default creative assignment"} ${this.code}`;
  }

  netVolume(): number {
    return Math.round(this.budget * this.updatedAt * 100) / 100;
  }

  copy(): DefaultCreativeAssignment {
    return new DefaultCreativeAssignment(
      this.code,
      this.label,
      this.priority,
      this.score,
      this.budget,
      this.name,
      this.durationMinutes,
      this.updatedAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a default creative assignment in status new. */
export function newDefaultCreativeAssignment(code: string, label: string): DefaultCreativeAssignment {
  return new DefaultCreativeAssignment(code, label, 0, 0, 0, "", 0, 0, "new");
}
