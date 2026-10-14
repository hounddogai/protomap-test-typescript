/**
 * The warmup preference records of deliverability's warmup work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a warmup preference is in its life cycle. */
export type WarmupPreferenceStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A warmup preference as the warmup team keeps it. */
export class WarmupPreference {
  code: string;
  label: string;
  description: string;
  endsAt: number;
  visible: boolean;
  minimum: number;
  status: WarmupPreferenceStatus;

  constructor(
    code: string,
    label: string,
    description: string,
    endsAt: number,
    visible: boolean,
    minimum: number,
    status: WarmupPreferenceStatus,
  ) {
    this.code = code;
    this.label = label;
    this.description = description;
    this.endsAt = endsAt;
    this.visible = visible;
    this.minimum = minimum;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: WarmupPreferenceStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending" || next === "suspended";
      case "pending":
        return next === "active" || next === "suspended";
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: WarmupPreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`warmup preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  projectedValue(): number {
    return Math.round(this.minimum * this.endsAt * 100) / 100;
  }

  copy(): WarmupPreference {
    return new WarmupPreference(
      this.code,
      this.label,
      this.description,
      this.endsAt,
      this.visible,
      this.minimum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a warmup preference in status draft. */
export function newWarmupPreference(code: string, label: string): WarmupPreference {
  return new WarmupPreference(code, label, "", 0, false, 0, "draft");
}
