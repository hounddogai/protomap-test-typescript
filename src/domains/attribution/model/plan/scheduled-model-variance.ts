import * as text from "../../../../kit/text.js";

/** Where a scheduled model variance is in its life cycle. */
export type ScheduledModelVarianceStatus = "new" | "queued" | "running" | "done" | "failed";

/** A scheduled model variance. Its code is unique within a tenant. */
export class ScheduledModelVariance {
  code: string;
  name: string;
  openRate: number;
  batchSize: number;
  visible: boolean;
  status: ScheduledModelVarianceStatus;

  constructor(
    code: string,
    name: string,
    openRate: number,
    batchSize: number,
    visible: boolean,
    status: ScheduledModelVarianceStatus,
  ) {
    this.code = code;
    this.name = name;
    this.openRate = openRate;
    this.batchSize = batchSize;
    this.visible = visible;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: ScheduledModelVarianceStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued" || next === "failed";
      case "queued":
        return next === "done";
      case "running":
        return next === "done" || next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ScheduledModelVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled model variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  projectedExposure(): number {
    return Math.round((this.openRate + this.batchSize) * 100) / 100;
  }

  copy(): ScheduledModelVariance {
    return new ScheduledModelVariance(this.code, this.name, this.openRate, this.batchSize, this.visible, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a scheduled model variance in status new. */
export function newScheduledModelVariance(code: string, name: string): ScheduledModelVariance {
  return new ScheduledModelVariance(code, name, 0, 0, false, "new");
}
