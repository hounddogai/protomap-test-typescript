/**
 * The weighted escalation adjustment records of support's escalation work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a weighted escalation adjustment is in its life cycle. */
export type WeightedEscalationAdjustmentStatus = "created" | "validated" | "published" | "retired";

/** A weighted escalation adjustment. Its code is unique within a tenant. */
export class WeightedEscalationAdjustment {
  code: string;
  label: string;
  locale: string;
  startsAt: number;
  tags: string[];
  limit: number;
  weight: number;
  status: WeightedEscalationAdjustmentStatus;

  constructor(
    code: string,
    label: string,
    locale: string,
    startsAt: number,
    tags: string[],
    limit: number,
    weight: number,
    status: WeightedEscalationAdjustmentStatus,
  ) {
    this.code = code;
    this.label = label;
    this.locale = locale;
    this.startsAt = startsAt;
    this.tags = tags;
    this.limit = limit;
    this.weight = weight;
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

  canMoveTo(next: WeightedEscalationAdjustmentStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published";
      case "validated":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: WeightedEscalationAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted escalation adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  adjustedLoad(): number {
    return Math.round((this.weight - this.startsAt) * 100) / 100;
  }

  copy(): WeightedEscalationAdjustment {
    return new WeightedEscalationAdjustment(
      this.code,
      this.label,
      this.locale,
      this.startsAt,
      this.tags,
      this.limit,
      this.weight,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a weighted escalation adjustment in status created. */
export function newWeightedEscalationAdjustment(code: string, label: string): WeightedEscalationAdjustment {
  return new WeightedEscalationAdjustment(code, label, "", 0, [], 0, 0, "created");
}
