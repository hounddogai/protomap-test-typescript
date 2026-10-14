import * as text from "../../../../kit/text.js";

/** Where a scheduled reputation preference is in its life cycle. */
export type ScheduledReputationPreferenceStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a scheduled reputation preference and its current status. */
export class ScheduledReputationPreference {
  code: string;
  name: string;
  campaignRef: string;
  frequencyCap: number;
  conversionRate: number;
  tags: string[];
  batchSize: number;
  status: ScheduledReputationPreferenceStatus;

  constructor(
    code: string,
    name: string,
    campaignRef: string,
    frequencyCap: number,
    conversionRate: number,
    tags: string[],
    batchSize: number,
    status: ScheduledReputationPreferenceStatus,
  ) {
    this.code = code;
    this.name = name;
    this.campaignRef = campaignRef;
    this.frequencyCap = frequencyCap;
    this.conversionRate = conversionRate;
    this.tags = tags;
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

  canMoveTo(next: ScheduledReputationPreferenceStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "ready" || next === "draining";
      case "warming":
        return next === "stopped";
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

  moveTo(next: ScheduledReputationPreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled reputation preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  projectedTotal(): number {
    return Math.round(this.conversionRate * this.batchSize * 100) / 100;
  }

  copy(): ScheduledReputationPreference {
    return new ScheduledReputationPreference(
      this.code,
      this.name,
      this.campaignRef,
      this.frequencyCap,
      this.conversionRate,
      this.tags,
      this.batchSize,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a scheduled reputation preference in status idle. */
export function newScheduledReputationPreference(code: string, name: string): ScheduledReputationPreference {
  return new ScheduledReputationPreference(code, name, "", 0, 0, [], 0, "idle");
}
