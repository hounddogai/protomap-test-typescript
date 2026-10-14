import * as text from "../../../../kit/text.js";

/** Where a branch draft is in its life cycle. */
export type BranchDraftStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One branch draft, with what the planners need to act on it. */
export class BranchDraft {
  code: string;
  label: string;
  batchSize: number;
  updatedAt: number;
  version: number;
  checksum: string;
  variant: string;
  summary: string;
  budget: number;
  attempts: number;
  maximum: number;
  status: BranchDraftStatus;

  constructor(
    code: string,
    label: string,
    batchSize: number,
    updatedAt: number,
    version: number,
    checksum: string,
    variant: string,
    summary: string,
    budget: number,
    attempts: number,
    maximum: number,
    status: BranchDraftStatus,
  ) {
    this.code = code;
    this.label = label;
    this.batchSize = batchSize;
    this.updatedAt = updatedAt;
    this.version = version;
    this.checksum = checksum;
    this.variant = variant;
    this.summary = summary;
    this.budget = budget;
    this.attempts = attempts;
    this.maximum = maximum;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: BranchDraftStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        return next === "ready";
      case "ready":
        return next === "draining";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: BranchDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`branch draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  netExposure(): number {
    return Math.round((this.maximum - this.attempts) * 100) / 100;
  }

  copy(): BranchDraft {
    return new BranchDraft(
      this.code,
      this.label,
      this.batchSize,
      this.updatedAt,
      this.version,
      this.checksum,
      this.variant,
      this.summary,
      this.budget,
      this.attempts,
      this.maximum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a branch draft in status idle. */
export function newBranchDraft(code: string, label: string): BranchDraft {
  return new BranchDraft(code, label, 0, 0, 0, "", "", "", 0, 0, 0, "idle");
}
