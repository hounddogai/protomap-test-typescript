import * as text from "../../../../kit/text.js";

/** Where a rolling post quota is in its life cycle. */
export type RollingPostQuotaStatus = "new" | "queued" | "running" | "done" | "failed";

/** One rolling post quota, with what the planners need to act on it. */
export class RollingPostQuota {
  code: string;
  label: string;
  frequencyCap: number;
  archived: boolean;
  retries: number;
  status: RollingPostQuotaStatus;

  constructor(
    code: string,
    label: string,
    frequencyCap: number,
    archived: boolean,
    retries: number,
    status: RollingPostQuotaStatus,
  ) {
    this.code = code;
    this.label = label;
    this.frequencyCap = frequencyCap;
    this.archived = archived;
    this.retries = retries;
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

  canMoveTo(next: RollingPostQuotaStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued";
      case "queued":
        return next === "done";
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

  moveTo(next: RollingPostQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling post quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  netVolume(): number {
    return Math.round((this.retries + this.frequencyCap) * 100) / 100;
  }

  copy(): RollingPostQuota {
    return new RollingPostQuota(this.code, this.label, this.frequencyCap, this.archived, this.retries, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a rolling post quota in status new. */
export function newRollingPostQuota(code: string, label: string): RollingPostQuota {
  return new RollingPostQuota(code, label, 0, false, 0, "new");
}
