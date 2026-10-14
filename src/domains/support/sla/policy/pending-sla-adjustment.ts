import * as text from "../../../../kit/text.js";

/** Where a pending sla adjustment is in its life cycle. */
export type PendingSlaAdjustmentStatus = "new" | "queued" | "running" | "done" | "failed";

/** A pending sla adjustment as the sla team keeps it. */
export class PendingSlaAdjustment {
  code: string;
  name: string;
  ratio: number;
  graceDays: number;
  externalRef: string;
  tags: string[];
  status: PendingSlaAdjustmentStatus;

  constructor(
    code: string,
    name: string,
    ratio: number,
    graceDays: number,
    externalRef: string,
    tags: string[],
    status: PendingSlaAdjustmentStatus,
  ) {
    this.code = code;
    this.name = name;
    this.ratio = ratio;
    this.graceDays = graceDays;
    this.externalRef = externalRef;
    this.tags = tags;
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

  canMoveTo(next: PendingSlaAdjustmentStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "done":
          case "failed":
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

  moveTo(next: PendingSlaAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending sla adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  effectiveValue(): number {
    return Math.round(this.graceDays * this.ratio * 100) / 100;
  }

  copy(): PendingSlaAdjustment {
    return new PendingSlaAdjustment(
      this.code,
      this.name,
      this.ratio,
      this.graceDays,
      this.externalRef,
      this.tags,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a pending sla adjustment in status new. */
export function newPendingSlaAdjustment(code: string, name: string): PendingSlaAdjustment {
  return new PendingSlaAdjustment(code, name, 0, 0, "", [], "new");
}
