import * as text from "../../../../kit/text.js";

/** Where a pending warmup audit is in its life cycle. */
export type PendingWarmupAuditStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One pending warmup audit, with what the planners need to act on it. */
export class PendingWarmupAudit {
  code: string;
  label: string;
  batchSize: number;
  threshold: number;
  approved: boolean;
  tags: string[];
  status: PendingWarmupAuditStatus;

  constructor(
    code: string,
    label: string,
    batchSize: number,
    threshold: number,
    approved: boolean,
    tags: string[],
    status: PendingWarmupAuditStatus,
  ) {
    this.code = code;
    this.label = label;
    this.batchSize = batchSize;
    this.threshold = threshold;
    this.approved = approved;
    this.tags = tags;
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

  canMoveTo(next: PendingWarmupAuditStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
          case "draining":
            return true;
        }
        return false;
      case "warming":
        return next === "ready" || next === "stopped";
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PendingWarmupAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending warmup audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  netTotal(): number {
    return Math.round((this.batchSize - this.threshold) * 100) / 100;
  }

  copy(): PendingWarmupAudit {
    return new PendingWarmupAudit(
      this.code,
      this.label,
      this.batchSize,
      this.threshold,
      this.approved,
      this.tags,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a pending warmup audit in status idle. */
export function newPendingWarmupAudit(code: string, label: string): PendingWarmupAudit {
  return new PendingWarmupAudit(code, label, 0, 0, false, [], "idle");
}
