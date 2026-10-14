/**
 * The capped pacing tier records of adops's pacing work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a capped pacing tier is in its life cycle. */
export type CappedPacingTierStatus = "new" | "queued" | "running" | "done" | "failed";

/** A capped pacing tier. Its code is unique within a tenant. */
export class CappedPacingTier {
  code: string;
  title: string;
  externalRef: string;
  attempts: number;
  budget: number;
  visible: boolean;
  region: string;
  status: CappedPacingTierStatus;

  constructor(
    code: string,
    title: string,
    externalRef: string,
    attempts: number,
    budget: number,
    visible: boolean,
    region: string,
    status: CappedPacingTierStatus,
  ) {
    this.code = code;
    this.title = title;
    this.externalRef = externalRef;
    this.attempts = attempts;
    this.budget = budget;
    this.visible = visible;
    this.region = region;
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

  canMoveTo(next: CappedPacingTierStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "failed";
      case "queued":
        switch (next) {
          case "running":
          case "done":
            return true;
        }
        return false;
      case "running":
        return next === "done" || next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: CappedPacingTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped pacing tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  netTotal(): number {
    return Math.round((this.budget - this.attempts) * 100) / 100;
  }

  copy(): CappedPacingTier {
    return new CappedPacingTier(
      this.code,
      this.title,
      this.externalRef,
      this.attempts,
      this.budget,
      this.visible,
      this.region,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a capped pacing tier in status new. */
export function newCappedPacingTier(code: string, title: string): CappedPacingTier {
  return new CappedPacingTier(code, title, "", 0, 0, false, "", "new");
}
