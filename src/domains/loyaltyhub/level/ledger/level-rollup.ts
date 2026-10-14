import * as text from "../../../../kit/text.js";

/** Where a level rollup is in its life cycle. */
export type LevelRollupStatus = "created" | "validated" | "published" | "retired";

/** One level rollup, with what the planners need to act on it. */
export class LevelRollup {
  code: string;
  label: string;
  graceDays: number;
  retries: number;
  ownerId: string;
  archived: boolean;
  source: string;
  externalRef: string;
  status: LevelRollupStatus;

  constructor(
    code: string,
    label: string,
    graceDays: number,
    retries: number,
    ownerId: string,
    archived: boolean,
    source: string,
    externalRef: string,
    status: LevelRollupStatus,
  ) {
    this.code = code;
    this.label = label;
    this.graceDays = graceDays;
    this.retries = retries;
    this.ownerId = ownerId;
    this.archived = archived;
    this.source = source;
    this.externalRef = externalRef;
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

  canMoveTo(next: LevelRollupStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
            return true;
        }
        return false;
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: LevelRollupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`level rollup ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"level rollup"} ${this.code}`;
  }

  adjustedValue(): number {
    return Math.round(this.graceDays * this.retries * 100) / 100;
  }

  copy(): LevelRollup {
    return new LevelRollup(
      this.code,
      this.label,
      this.graceDays,
      this.retries,
      this.ownerId,
      this.archived,
      this.source,
      this.externalRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a level rollup in status created. */
export function newLevelRollup(code: string, label: string): LevelRollup {
  return new LevelRollup(code, label, 0, 0, "", false, "", "", "created");
}
