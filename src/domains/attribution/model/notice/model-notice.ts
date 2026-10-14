/**
 * The model notice records of attribution's model work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a model notice is in its life cycle. */
export type ModelNoticeStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a model notice and its current status. */
export class ModelNotice {
  code: string;
  label: string;
  utmSource: string;
  cost: number;
  archived: boolean;
  impressions: number;
  weight: number;
  attempts: number;
  batchSize: number;
  priority: number;
  status: ModelNoticeStatus;

  constructor(
    code: string,
    label: string,
    utmSource: string,
    cost: number,
    archived: boolean,
    impressions: number,
    weight: number,
    attempts: number,
    batchSize: number,
    priority: number,
    status: ModelNoticeStatus,
  ) {
    this.code = code;
    this.label = label;
    this.utmSource = utmSource;
    this.cost = cost;
    this.archived = archived;
    this.impressions = impressions;
    this.weight = weight;
    this.attempts = attempts;
    this.batchSize = batchSize;
    this.priority = priority;
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

  canMoveTo(next: ModelNoticeStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
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
        return next === "suspended";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: ModelNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`model notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  netVolume(): number {
    return Math.round(this.weight * this.cost * 100) / 100;
  }

  copy(): ModelNotice {
    return new ModelNotice(
      this.code,
      this.label,
      this.utmSource,
      this.cost,
      this.archived,
      this.impressions,
      this.weight,
      this.attempts,
      this.batchSize,
      this.priority,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a model notice in status draft. */
export function newModelNotice(code: string, label: string): ModelNotice {
  return new ModelNotice(code, label, "", 0, false, 0, 0, 0, 0, 0, "draft");
}
