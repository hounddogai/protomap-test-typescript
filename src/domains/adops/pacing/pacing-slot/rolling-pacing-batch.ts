import * as text from "../../../../kit/text.js";

/** Where a rolling pacing batch is in its life cycle. */
export type RollingPacingBatchStatus = "created" | "validated" | "published" | "retired";

/** The record of a rolling pacing batch and its current status. */
export class RollingPacingBatch {
  code: string;
  name: string;
  timezone: string;
  maximum: number;
  tags: string[];
  status: RollingPacingBatchStatus;

  constructor(
    code: string,
    name: string,
    timezone: string,
    maximum: number,
    tags: string[],
    status: RollingPacingBatchStatus,
  ) {
    this.code = code;
    this.name = name;
    this.timezone = timezone;
    this.maximum = maximum;
    this.tags = tags;
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

  canMoveTo(next: RollingPacingBatchStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published" || next === "retired";
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

  moveTo(next: RollingPacingBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling pacing batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  measuredValue(): number {
    return this.maximum;
  }

  copy(): RollingPacingBatch {
    return new RollingPacingBatch(this.code, this.name, this.timezone, this.maximum, this.tags, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a rolling pacing batch in status created. */
export function newRollingPacingBatch(code: string, name: string): RollingPacingBatch {
  return new RollingPacingBatch(code, name, "", 0, [], "created");
}
