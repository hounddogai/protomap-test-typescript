/**
 * The manual touchpoint target records of attribution's touchpoint work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a manual touchpoint target is in its life cycle. */
export type ManualTouchpointTargetStatus = "created" | "validated" | "published" | "retired";

/** The record of a manual touchpoint target and its current status. */
export class ManualTouchpointTarget {
  code: string;
  label: string;
  priority: number;
  contactEmail: string;
  sequence: number;
  discount: number;
  clicks: number;
  tags: string[];
  attempts: number;
  status: ManualTouchpointTargetStatus;

  constructor(
    code: string,
    label: string,
    priority: number,
    contactEmail: string,
    sequence: number,
    discount: number,
    clicks: number,
    tags: string[],
    attempts: number,
    status: ManualTouchpointTargetStatus,
  ) {
    this.code = code;
    this.label = label;
    this.priority = priority;
    this.contactEmail = contactEmail;
    this.sequence = sequence;
    this.discount = discount;
    this.clicks = clicks;
    this.tags = tags;
    this.attempts = attempts;
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

  canMoveTo(next: ManualTouchpointTargetStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
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

  moveTo(next: ManualTouchpointTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual touchpoint target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  projectedExposure(): number {
    return Math.round(this.discount * this.attempts * 100) / 100;
  }

  copy(): ManualTouchpointTarget {
    return new ManualTouchpointTarget(
      this.code,
      this.label,
      this.priority,
      this.contactEmail,
      this.sequence,
      this.discount,
      this.clicks,
      this.tags,
      this.attempts,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a manual touchpoint target in status created. */
export function newManualTouchpointTarget(code: string, label: string): ManualTouchpointTarget {
  return new ManualTouchpointTarget(code, label, 0, "", 0, 0, 0, [], 0, "created");
}
