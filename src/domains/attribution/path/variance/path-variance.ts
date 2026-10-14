/**
 * The path variance records of attribution's path work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a path variance is in its life cycle. */
export type PathVarianceStatus = "requested" | "granted" | "revoked" | "expired";

/** A path variance as the path team keeps it. */
export class PathVariance {
  code: string;
  name: string;
  visible: boolean;
  attempts: number;
  ratio: number;
  notes: string;
  batchSize: number;
  graceDays: number;
  status: PathVarianceStatus;

  constructor(
    code: string,
    name: string,
    visible: boolean,
    attempts: number,
    ratio: number,
    notes: string,
    batchSize: number,
    graceDays: number,
    status: PathVarianceStatus,
  ) {
    this.code = code;
    this.name = name;
    this.visible = visible;
    this.attempts = attempts;
    this.ratio = ratio;
    this.notes = notes;
    this.batchSize = batchSize;
    this.graceDays = graceDays;
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

  canMoveTo(next: PathVarianceStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted";
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PathVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`path variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  netVolume(): number {
    return Math.round(this.batchSize * this.graceDays * 100) / 100;
  }

  copy(): PathVariance {
    return new PathVariance(
      this.code,
      this.name,
      this.visible,
      this.attempts,
      this.ratio,
      this.notes,
      this.batchSize,
      this.graceDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a path variance in status requested. */
export function newPathVariance(code: string, name: string): PathVariance {
  return new PathVariance(code, name, false, 0, 0, "", 0, 0, "requested");
}
