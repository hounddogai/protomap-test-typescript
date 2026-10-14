import * as text from "../../../../kit/text.js";

/** Where a rolling branch variance is in its life cycle. */
export type RollingBranchVarianceStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One rolling branch variance, with what the planners need to act on it. */
export class RollingBranchVariance {
  code: string;
  title: string;
  archived: boolean;
  startsAt: number;
  channel: string;
  ownerId: string;
  batchSize: number;
  status: RollingBranchVarianceStatus;

  constructor(
    code: string,
    title: string,
    archived: boolean,
    startsAt: number,
    channel: string,
    ownerId: string,
    batchSize: number,
    status: RollingBranchVarianceStatus,
  ) {
    this.code = code;
    this.title = title;
    this.archived = archived;
    this.startsAt = startsAt;
    this.channel = channel;
    this.ownerId = ownerId;
    this.batchSize = batchSize;
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

  canMoveTo(next: RollingBranchVarianceStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "draining" || next === "stopped";
      case "warming":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: RollingBranchVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling branch variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"rolling branch variance"} ${this.code}`;
  }

  netExposure(): number {
    return Math.round(this.batchSize * this.startsAt * 100) / 100;
  }

  copy(): RollingBranchVariance {
    return new RollingBranchVariance(
      this.code,
      this.title,
      this.archived,
      this.startsAt,
      this.channel,
      this.ownerId,
      this.batchSize,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a rolling branch variance in status idle. */
export function newRollingBranchVariance(code: string, title: string): RollingBranchVariance {
  return new RollingBranchVariance(code, title, false, 0, "", "", 0, "idle");
}
