/**
 * The touchpoint preference records of attribution's touchpoint work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a touchpoint preference is in its life cycle. */
export type TouchpointPreferenceStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One touchpoint preference, with what the planners need to act on it. */
export class TouchpointPreference {
  code: string;
  label: string;
  batchSize: number;
  weight: number;
  externalRef: string;
  status: TouchpointPreferenceStatus;

  constructor(
    code: string,
    label: string,
    batchSize: number,
    weight: number,
    externalRef: string,
    status: TouchpointPreferenceStatus,
  ) {
    this.code = code;
    this.label = label;
    this.batchSize = batchSize;
    this.weight = weight;
    this.externalRef = externalRef;
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

  canMoveTo(next: TouchpointPreferenceStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "active":
          case "closed":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TouchpointPreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`touchpoint preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"touchpoint preference"} ${this.code}`;
  }

  netLoad(): number {
    return Math.round(this.batchSize * this.weight * 100) / 100;
  }

  copy(): TouchpointPreference {
    return new TouchpointPreference(this.code, this.label, this.batchSize, this.weight, this.externalRef, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a touchpoint preference in status draft. */
export function newTouchpointPreference(code: string, label: string): TouchpointPreference {
  return new TouchpointPreference(code, label, 0, 0, "", "draft");
}
