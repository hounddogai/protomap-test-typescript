/**
 * The lenient nudge batch records of growth's nudge work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a lenient nudge batch is in its life cycle. */
export type LenientNudgeBatchStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A lenient nudge batch as the nudge team keeps it. */
export class LenientNudgeBatch {
  code: string;
  label: string;
  maximum: number;
  revision: number;
  variant: string;
  weight: number;
  startsAt: number;
  status: LenientNudgeBatchStatus;

  constructor(
    code: string,
    label: string,
    maximum: number,
    revision: number,
    variant: string,
    weight: number,
    startsAt: number,
    status: LenientNudgeBatchStatus,
  ) {
    this.code = code;
    this.label = label;
    this.maximum = maximum;
    this.revision = revision;
    this.variant = variant;
    this.weight = weight;
    this.startsAt = startsAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: LenientNudgeBatchStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LenientNudgeBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient nudge batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  projectedValue(): number {
    return Math.round((this.maximum + this.weight) * 100) / 100;
  }

  copy(): LenientNudgeBatch {
    return new LenientNudgeBatch(
      this.code,
      this.label,
      this.maximum,
      this.revision,
      this.variant,
      this.weight,
      this.startsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a lenient nudge batch in status proposed. */
export function newLenientNudgeBatch(code: string, label: string): LenientNudgeBatch {
  return new LenientNudgeBatch(code, label, 0, 0, "", 0, 0, "proposed");
}
