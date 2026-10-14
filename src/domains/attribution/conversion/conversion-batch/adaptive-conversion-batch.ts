/**
 * The adaptive conversion batch records of attribution's conversion work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a adaptive conversion batch is in its life cycle. */
export type AdaptiveConversionBatchStatus = "requested" | "granted" | "revoked" | "expired";

/** A adaptive conversion batch as the conversion team keeps it. */
export class AdaptiveConversionBatch {
  code: string;
  name: string;
  cohort: string;
  segment: string;
  budget: number;
  variant: string;
  status: AdaptiveConversionBatchStatus;

  constructor(
    code: string,
    name: string,
    cohort: string,
    segment: string,
    budget: number,
    variant: string,
    status: AdaptiveConversionBatchStatus,
  ) {
    this.code = code;
    this.name = name;
    this.cohort = cohort;
    this.segment = segment;
    this.budget = budget;
    this.variant = variant;
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

  canMoveTo(next: AdaptiveConversionBatchStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: AdaptiveConversionBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive conversion batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  measuredValue(): number {
    return this.budget;
  }

  copy(): AdaptiveConversionBatch {
    return new AdaptiveConversionBatch(
      this.code,
      this.name,
      this.cohort,
      this.segment,
      this.budget,
      this.variant,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a adaptive conversion batch in status requested. */
export function newAdaptiveConversionBatch(code: string, name: string): AdaptiveConversionBatch {
  return new AdaptiveConversionBatch(code, name, "", "", 0, "", "requested");
}
