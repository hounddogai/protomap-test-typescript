import * as text from "../../../../kit/text.js";

/** Where a pending pacing target is in its life cycle. */
export type PendingPacingTargetStatus = "requested" | "granted" | "revoked" | "expired";

/** One pending pacing target, with what the planners need to act on it. */
export class PendingPacingTarget {
  code: string;
  name: string;
  label: string;
  frequencyCap: number;
  audienceId: string;
  status: PendingPacingTargetStatus;

  constructor(
    code: string,
    name: string,
    label: string,
    frequencyCap: number,
    audienceId: string,
    status: PendingPacingTargetStatus,
  ) {
    this.code = code;
    this.name = name;
    this.label = label;
    this.frequencyCap = frequencyCap;
    this.audienceId = audienceId;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: PendingPacingTargetStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PendingPacingTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending pacing target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"pending pacing target"} ${this.code}`;
  }

  measuredValue(): number {
    return this.frequencyCap;
  }

  copy(): PendingPacingTarget {
    return new PendingPacingTarget(this.code, this.name, this.label, this.frequencyCap, this.audienceId, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a pending pacing target in status requested. */
export function newPendingPacingTarget(code: string, name: string): PendingPacingTarget {
  return new PendingPacingTarget(code, name, "", 0, "", "requested");
}
