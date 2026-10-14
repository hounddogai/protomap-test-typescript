import * as text from "../../../../kit/text.js";

/** Where a lenient warmup proposal is in its life cycle. */
export type LenientWarmupProposalStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a lenient warmup proposal and its current status. */
export class LenientWarmupProposal {
  code: string;
  name: string;
  clicks: number;
  limit: number;
  threshold: number;
  approved: boolean;
  graceDays: number;
  version: number;
  status: LenientWarmupProposalStatus;

  constructor(
    code: string,
    name: string,
    clicks: number,
    limit: number,
    threshold: number,
    approved: boolean,
    graceDays: number,
    version: number,
    status: LenientWarmupProposalStatus,
  ) {
    this.code = code;
    this.name = name;
    this.clicks = clicks;
    this.limit = limit;
    this.threshold = threshold;
    this.approved = approved;
    this.graceDays = graceDays;
    this.version = version;
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

  canMoveTo(next: LenientWarmupProposalStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LenientWarmupProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient warmup proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  weightedVolume(): number {
    return Math.round((this.threshold + this.version) * 100) / 100;
  }

  copy(): LenientWarmupProposal {
    return new LenientWarmupProposal(
      this.code,
      this.name,
      this.clicks,
      this.limit,
      this.threshold,
      this.approved,
      this.graceDays,
      this.version,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a lenient warmup proposal in status idle. */
export function newLenientWarmupProposal(code: string, name: string): LenientWarmupProposal {
  return new LenientWarmupProposal(code, name, 0, 0, 0, false, 0, 0, "idle");
}
