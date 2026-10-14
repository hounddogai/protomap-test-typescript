import * as text from "../../../../kit/text.js";

/** Where a capped nudge allocation is in its life cycle. */
export type CappedNudgeAllocationStatus = "new" | "queued" | "running" | "done" | "failed";

/** One capped nudge allocation, with what the planners need to act on it. */
export class CappedNudgeAllocation {
  code: string;
  label: string;
  title: string;
  revision: number;
  version: number;
  channel: string;
  status: CappedNudgeAllocationStatus;

  constructor(
    code: string,
    label: string,
    title: string,
    revision: number,
    version: number,
    channel: string,
    status: CappedNudgeAllocationStatus,
  ) {
    this.code = code;
    this.label = label;
    this.title = title;
    this.revision = revision;
    this.version = version;
    this.channel = channel;
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

  canMoveTo(next: CappedNudgeAllocationStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: CappedNudgeAllocationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped nudge allocation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  projectedVolume(): number {
    return Math.round((this.revision + this.version) * 100) / 100;
  }

  copy(): CappedNudgeAllocation {
    return new CappedNudgeAllocation(
      this.code,
      this.label,
      this.title,
      this.revision,
      this.version,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a capped nudge allocation in status new. */
export function newCappedNudgeAllocation(code: string, label: string): CappedNudgeAllocation {
  return new CappedNudgeAllocation(code, label, "", 0, 0, "", "new");
}
