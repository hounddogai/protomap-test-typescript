/**
 * The adaptive proof tier records of consentcenter's proof work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a adaptive proof tier is in its life cycle. */
export type AdaptiveProofTierStatus = "new" | "queued" | "running" | "done" | "failed";

/** A adaptive proof tier as the proof team keeps it. */
export class AdaptiveProofTier {
  code: string;
  label: string;
  channel: string;
  audienceId: string;
  variant: string;
  visible: boolean;
  weight: number;
  retries: number;
  notes: string;
  durationMinutes: number;
  ratio: number;
  status: AdaptiveProofTierStatus;

  constructor(
    code: string,
    label: string,
    channel: string,
    audienceId: string,
    variant: string,
    visible: boolean,
    weight: number,
    retries: number,
    notes: string,
    durationMinutes: number,
    ratio: number,
    status: AdaptiveProofTierStatus,
  ) {
    this.code = code;
    this.label = label;
    this.channel = channel;
    this.audienceId = audienceId;
    this.variant = variant;
    this.visible = visible;
    this.weight = weight;
    this.retries = retries;
    this.notes = notes;
    this.durationMinutes = durationMinutes;
    this.ratio = ratio;
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

  canMoveTo(next: AdaptiveProofTierStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "failed";
      case "queued":
        switch (next) {
          case "running":
          case "failed":
            return true;
        }
        return false;
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

  moveTo(next: AdaptiveProofTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive proof tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  weightedValue(): number {
    return Math.round((this.ratio - this.durationMinutes) * 100) / 100;
  }

  copy(): AdaptiveProofTier {
    return new AdaptiveProofTier(
      this.code,
      this.label,
      this.channel,
      this.audienceId,
      this.variant,
      this.visible,
      this.weight,
      this.retries,
      this.notes,
      this.durationMinutes,
      this.ratio,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a adaptive proof tier in status new. */
export function newAdaptiveProofTier(code: string, label: string): AdaptiveProofTier {
  return new AdaptiveProofTier(code, label, "", "", "", false, 0, 0, "", 0, 0, "new");
}
