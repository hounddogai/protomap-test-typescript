import * as text from "../../../../kit/text.js";

/** Where a lenient flight metric is in its life cycle. */
export type LenientFlightMetricStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A lenient flight metric as the flight team keeps it. */
export class LenientFlightMetric {
  code: string;
  label: string;
  maximum: number;
  notes: string;
  retries: number;
  ownerId: string;
  revision: number;
  channel: string;
  externalRef: string;
  status: LenientFlightMetricStatus;

  constructor(
    code: string,
    label: string,
    maximum: number,
    notes: string,
    retries: number,
    ownerId: string,
    revision: number,
    channel: string,
    externalRef: string,
    status: LenientFlightMetricStatus,
  ) {
    this.code = code;
    this.label = label;
    this.maximum = maximum;
    this.notes = notes;
    this.retries = retries;
    this.ownerId = ownerId;
    this.revision = revision;
    this.channel = channel;
    this.externalRef = externalRef;
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

  canMoveTo(next: LenientFlightMetricStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
          case "suspended":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
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

  moveTo(next: LenientFlightMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient flight metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  netTotal(): number {
    return Math.round((this.maximum + this.revision) * 100) / 100;
  }

  copy(): LenientFlightMetric {
    return new LenientFlightMetric(
      this.code,
      this.label,
      this.maximum,
      this.notes,
      this.retries,
      this.ownerId,
      this.revision,
      this.channel,
      this.externalRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a lenient flight metric in status draft. */
export function newLenientFlightMetric(code: string, label: string): LenientFlightMetric {
  return new LenientFlightMetric(code, label, 0, "", 0, "", 0, "", "", "draft");
}
