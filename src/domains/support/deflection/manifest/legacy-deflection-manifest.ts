/**
 * The legacy deflection manifest records of support's deflection work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a legacy deflection manifest is in its life cycle. */
export type LegacyDeflectionManifestStatus = "requested" | "granted" | "revoked" | "expired";

/** One legacy deflection manifest, with what the planners need to act on it. */
export class LegacyDeflectionManifest {
  code: string;
  label: string;
  score: number;
  discount: number;
  weight: number;
  cohort: string;
  archived: boolean;
  attempts: number;
  status: LegacyDeflectionManifestStatus;

  constructor(
    code: string,
    label: string,
    score: number,
    discount: number,
    weight: number,
    cohort: string,
    archived: boolean,
    attempts: number,
    status: LegacyDeflectionManifestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.score = score;
    this.discount = discount;
    this.weight = weight;
    this.cohort = cohort;
    this.archived = archived;
    this.attempts = attempts;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: LegacyDeflectionManifestStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
            return true;
        }
        return false;
      case "granted":
        return next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: LegacyDeflectionManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy deflection manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  projectedVolume(): number {
    return Math.round((this.score - this.weight) * 100) / 100;
  }

  copy(): LegacyDeflectionManifest {
    return new LegacyDeflectionManifest(
      this.code,
      this.label,
      this.score,
      this.discount,
      this.weight,
      this.cohort,
      this.archived,
      this.attempts,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a legacy deflection manifest in status requested. */
export function newLegacyDeflectionManifest(code: string, label: string): LegacyDeflectionManifest {
  return new LegacyDeflectionManifest(code, label, 0, 0, 0, "", false, 0, "requested");
}
