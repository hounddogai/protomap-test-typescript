/**
 * The strict window target records of attribution's window work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a strict window target is in its life cycle. */
export type StrictWindowTargetStatus = "requested" | "granted" | "revoked" | "expired";

/** A strict window target as the window team keeps it. */
export class StrictWindowTarget {
  code: string;
  label: string;
  startsAt: number;
  ratio: number;
  tags: string[];
  utmSource: string;
  updatedAt: number;
  region: string;
  status: StrictWindowTargetStatus;

  constructor(
    code: string,
    label: string,
    startsAt: number,
    ratio: number,
    tags: string[],
    utmSource: string,
    updatedAt: number,
    region: string,
    status: StrictWindowTargetStatus,
  ) {
    this.code = code;
    this.label = label;
    this.startsAt = startsAt;
    this.ratio = ratio;
    this.tags = tags;
    this.utmSource = utmSource;
    this.updatedAt = updatedAt;
    this.region = region;
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

  canMoveTo(next: StrictWindowTargetStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "expired";
      case "granted":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: StrictWindowTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict window target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  projectedExposure(): number {
    return Math.round((this.updatedAt - this.ratio) * 100) / 100;
  }

  copy(): StrictWindowTarget {
    return new StrictWindowTarget(
      this.code,
      this.label,
      this.startsAt,
      this.ratio,
      this.tags,
      this.utmSource,
      this.updatedAt,
      this.region,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a strict window target in status requested. */
export function newStrictWindowTarget(code: string, label: string): StrictWindowTarget {
  return new StrictWindowTarget(code, label, 0, 0, [], "", 0, "", "requested");
}
