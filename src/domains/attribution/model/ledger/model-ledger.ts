/**
 * The model ledger records of attribution's model work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a model ledger is in its life cycle. */
export type ModelLedgerStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One model ledger, with what the planners need to act on it. */
export class ModelLedger {
  code: string;
  label: string;
  timezone: string;
  visible: boolean;
  retries: number;
  impressions: number;
  status: ModelLedgerStatus;

  constructor(
    code: string,
    label: string,
    timezone: string,
    visible: boolean,
    retries: number,
    impressions: number,
    status: ModelLedgerStatus,
  ) {
    this.code = code;
    this.label = label;
    this.timezone = timezone;
    this.visible = visible;
    this.retries = retries;
    this.impressions = impressions;
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

  canMoveTo(next: ModelLedgerStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
          case "draining":
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

  moveTo(next: ModelLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`model ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  adjustedExposure(): number {
    return Math.round(this.retries * this.impressions * 100) / 100;
  }

  copy(): ModelLedger {
    return new ModelLedger(
      this.code,
      this.label,
      this.timezone,
      this.visible,
      this.retries,
      this.impressions,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a model ledger in status idle. */
export function newModelLedger(code: string, label: string): ModelLedger {
  return new ModelLedger(code, label, "", false, 0, 0, "idle");
}
