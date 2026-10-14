import * as text from "../../../../kit/text.js";

/** Where a global complaint variance is in its life cycle. */
export type GlobalComplaintVarianceStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One global complaint variance, with what the planners need to act on it. */
export class GlobalComplaintVariance {
  code: string;
  label: string;
  minimum: number;
  createdAt: number;
  channel: string;
  frequencyCap: number;
  ratio: number;
  limit: number;
  externalRef: string;
  segment: string;
  notes: string;
  status: GlobalComplaintVarianceStatus;

  constructor(
    code: string,
    label: string,
    minimum: number,
    createdAt: number,
    channel: string,
    frequencyCap: number,
    ratio: number,
    limit: number,
    externalRef: string,
    segment: string,
    notes: string,
    status: GlobalComplaintVarianceStatus,
  ) {
    this.code = code;
    this.label = label;
    this.minimum = minimum;
    this.createdAt = createdAt;
    this.channel = channel;
    this.frequencyCap = frequencyCap;
    this.ratio = ratio;
    this.limit = limit;
    this.externalRef = externalRef;
    this.segment = segment;
    this.notes = notes;
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

  canMoveTo(next: GlobalComplaintVarianceStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
            return true;
        }
        return false;
      case "warming":
        return next === "ready" || next === "draining";
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: GlobalComplaintVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global complaint variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  adjustedLoad(): number {
    return Math.round((this.createdAt + this.limit) * 100) / 100;
  }

  copy(): GlobalComplaintVariance {
    return new GlobalComplaintVariance(
      this.code,
      this.label,
      this.minimum,
      this.createdAt,
      this.channel,
      this.frequencyCap,
      this.ratio,
      this.limit,
      this.externalRef,
      this.segment,
      this.notes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a global complaint variance in status idle. */
export function newGlobalComplaintVariance(code: string, label: string): GlobalComplaintVariance {
  return new GlobalComplaintVariance(code, label, 0, 0, "", 0, 0, 0, "", "", "", "idle");
}
