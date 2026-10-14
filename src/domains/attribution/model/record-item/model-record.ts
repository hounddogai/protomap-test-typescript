/**
 * The model record records of attribution's model work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a model record is in its life cycle. */
export type ModelRecordStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a model record and its current status. */
export class ModelRecord {
  code: string;
  name: string;
  utmSource: string;
  sequence: number;
  maximum: number;
  endsAt: number;
  unit: string;
  threshold: number;
  score: number;
  status: ModelRecordStatus;

  constructor(
    code: string,
    name: string,
    utmSource: string,
    sequence: number,
    maximum: number,
    endsAt: number,
    unit: string,
    threshold: number,
    score: number,
    status: ModelRecordStatus,
  ) {
    this.code = code;
    this.name = name;
    this.utmSource = utmSource;
    this.sequence = sequence;
    this.maximum = maximum;
    this.endsAt = endsAt;
    this.unit = unit;
    this.threshold = threshold;
    this.score = score;
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

  canMoveTo(next: ModelRecordStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "ready":
          case "stopped":
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
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: ModelRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`model record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  weightedVolume(): number {
    return Math.round(this.sequence * this.threshold * 100) / 100;
  }

  copy(): ModelRecord {
    return new ModelRecord(
      this.code,
      this.name,
      this.utmSource,
      this.sequence,
      this.maximum,
      this.endsAt,
      this.unit,
      this.threshold,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a model record in status idle. */
export function newModelRecord(code: string, name: string): ModelRecord {
  return new ModelRecord(code, name, "", 0, 0, 0, "", 0, 0, "idle");
}
