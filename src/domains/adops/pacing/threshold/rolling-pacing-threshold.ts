/**
 * The rolling pacing threshold records of adops's pacing work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a rolling pacing threshold is in its life cycle. */
export type RollingPacingThresholdStatus = "created" | "validated" | "published" | "retired";

/** A rolling pacing threshold. Its code is unique within a tenant. */
export class RollingPacingThreshold {
  code: string;
  name: string;
  threshold: number;
  reviewer: string;
  durationMinutes: number;
  unit: string;
  currency: string;
  tags: string[];
  status: RollingPacingThresholdStatus;

  constructor(
    code: string,
    name: string,
    threshold: number,
    reviewer: string,
    durationMinutes: number,
    unit: string,
    currency: string,
    tags: string[],
    status: RollingPacingThresholdStatus,
  ) {
    this.code = code;
    this.name = name;
    this.threshold = threshold;
    this.reviewer = reviewer;
    this.durationMinutes = durationMinutes;
    this.unit = unit;
    this.currency = currency;
    this.tags = tags;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: RollingPacingThresholdStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RollingPacingThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling pacing threshold ${this.code} cannot move from ${this.status} to ${next}`);
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

  netVolume(): number {
    return Math.round((this.threshold - this.durationMinutes) * 100) / 100;
  }

  copy(): RollingPacingThreshold {
    return new RollingPacingThreshold(
      this.code,
      this.name,
      this.threshold,
      this.reviewer,
      this.durationMinutes,
      this.unit,
      this.currency,
      this.tags,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a rolling pacing threshold in status created. */
export function newRollingPacingThreshold(code: string, name: string): RollingPacingThreshold {
  return new RollingPacingThreshold(code, name, 0, "", 0, "", "", [], "created");
}
