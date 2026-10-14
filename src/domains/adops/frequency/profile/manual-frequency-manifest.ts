import * as text from "../../../../kit/text.js";

/** Where a manual frequency manifest is in its life cycle. */
export type ManualFrequencyManifestStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A manual frequency manifest as the frequency team keeps it. */
export class ManualFrequencyManifest {
  code: string;
  label: string;
  limit: number;
  attempts: number;
  retries: number;
  weight: number;
  durationMinutes: number;
  campaignRef: string;
  status: ManualFrequencyManifestStatus;

  constructor(
    code: string,
    label: string,
    limit: number,
    attempts: number,
    retries: number,
    weight: number,
    durationMinutes: number,
    campaignRef: string,
    status: ManualFrequencyManifestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.limit = limit;
    this.attempts = attempts;
    this.retries = retries;
    this.weight = weight;
    this.durationMinutes = durationMinutes;
    this.campaignRef = campaignRef;
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

  canMoveTo(next: ManualFrequencyManifestStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
          case "ready":
            return true;
        }
        return false;
      case "warming":
        return next === "ready" || next === "draining";
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: ManualFrequencyManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual frequency manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  netValue(): number {
    return Math.round(this.weight * this.attempts * 100) / 100;
  }

  copy(): ManualFrequencyManifest {
    return new ManualFrequencyManifest(
      this.code,
      this.label,
      this.limit,
      this.attempts,
      this.retries,
      this.weight,
      this.durationMinutes,
      this.campaignRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a manual frequency manifest in status idle. */
export function newManualFrequencyManifest(code: string, label: string): ManualFrequencyManifest {
  return new ManualFrequencyManifest(code, label, 0, 0, 0, 0, 0, "", "idle");
}
