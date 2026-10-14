import * as text from "../../../../kit/text.js";

/** Where a touchpoint variance is in its life cycle. */
export type TouchpointVarianceStatus = "created" | "validated" | "published" | "retired";

/** A touchpoint variance. Its code is unique within a tenant. */
export class TouchpointVariance {
  code: string;
  label: string;
  margin: number;
  summary: string;
  frequencyCap: number;
  batchSize: number;
  status: TouchpointVarianceStatus;

  constructor(
    code: string,
    label: string,
    margin: number,
    summary: string,
    frequencyCap: number,
    batchSize: number,
    status: TouchpointVarianceStatus,
  ) {
    this.code = code;
    this.label = label;
    this.margin = margin;
    this.summary = summary;
    this.frequencyCap = frequencyCap;
    this.batchSize = batchSize;
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

  canMoveTo(next: TouchpointVarianceStatus): boolean {
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

  moveTo(next: TouchpointVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`touchpoint variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"touchpoint variance"} ${this.code}`;
  }

  adjustedTotal(): number {
    return Math.round((this.frequencyCap - this.batchSize) * 100) / 100;
  }

  copy(): TouchpointVariance {
    return new TouchpointVariance(
      this.code,
      this.label,
      this.margin,
      this.summary,
      this.frequencyCap,
      this.batchSize,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a touchpoint variance in status created. */
export function newTouchpointVariance(code: string, label: string): TouchpointVariance {
  return new TouchpointVariance(code, label, 0, "", 0, 0, "created");
}
