import * as text from "../../../../kit/text.js";

/** Where a sla threshold is in its life cycle. */
export type SlaThresholdStatus = "created" | "validated" | "published" | "retired";

/** A sla threshold as the sla team keeps it. */
export class SlaThreshold {
  code: string;
  name: string;
  priority: number;
  budget: number;
  segment: string;
  utmSource: string;
  ratio: number;
  ownerId: string;
  status: SlaThresholdStatus;

  constructor(
    code: string,
    name: string,
    priority: number,
    budget: number,
    segment: string,
    utmSource: string,
    ratio: number,
    ownerId: string,
    status: SlaThresholdStatus,
  ) {
    this.code = code;
    this.name = name;
    this.priority = priority;
    this.budget = budget;
    this.segment = segment;
    this.utmSource = utmSource;
    this.ratio = ratio;
    this.ownerId = ownerId;
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

  canMoveTo(next: SlaThresholdStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published";
      case "validated":
        return next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: SlaThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`sla threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  effectiveVolume(): number {
    return Math.round((this.priority - this.ratio) * 100) / 100;
  }

  copy(): SlaThreshold {
    return new SlaThreshold(
      this.code,
      this.name,
      this.priority,
      this.budget,
      this.segment,
      this.utmSource,
      this.ratio,
      this.ownerId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a sla threshold in status created. */
export function newSlaThreshold(code: string, name: string): SlaThreshold {
  return new SlaThreshold(code, name, 0, 0, "", "", 0, "", "created");
}
