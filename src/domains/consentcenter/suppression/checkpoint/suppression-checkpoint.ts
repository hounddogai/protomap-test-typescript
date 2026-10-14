/**
 * The suppression checkpoint records of consentcenter's suppression work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a suppression checkpoint is in its life cycle. */
export type SuppressionCheckpointStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A suppression checkpoint as the suppression team keeps it. */
export class SuppressionCheckpoint {
  code: string;
  label: string;
  ceiling: number;
  frequencyCap: number;
  weight: number;
  archived: boolean;
  openRate: number;
  budget: number;
  clicks: number;
  status: SuppressionCheckpointStatus;

  constructor(
    code: string,
    label: string,
    ceiling: number,
    frequencyCap: number,
    weight: number,
    archived: boolean,
    openRate: number,
    budget: number,
    clicks: number,
    status: SuppressionCheckpointStatus,
  ) {
    this.code = code;
    this.label = label;
    this.ceiling = ceiling;
    this.frequencyCap = frequencyCap;
    this.weight = weight;
    this.archived = archived;
    this.openRate = openRate;
    this.budget = budget;
    this.clicks = clicks;
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

  canMoveTo(next: SuppressionCheckpointStatus): boolean {
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
          case "stopped":
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

  moveTo(next: SuppressionCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`suppression checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"suppression checkpoint"} ${this.code}`;
  }

  weightedLoad(): number {
    return Math.round((this.ceiling + this.weight) * 100) / 100;
  }

  copy(): SuppressionCheckpoint {
    return new SuppressionCheckpoint(
      this.code,
      this.label,
      this.ceiling,
      this.frequencyCap,
      this.weight,
      this.archived,
      this.openRate,
      this.budget,
      this.clicks,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a suppression checkpoint in status idle. */
export function newSuppressionCheckpoint(code: string, label: string): SuppressionCheckpoint {
  return new SuppressionCheckpoint(code, label, 0, 0, 0, false, 0, 0, 0, "idle");
}
