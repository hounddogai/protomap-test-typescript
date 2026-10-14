import * as text from "../../../../kit/text.js";

/** Where a frequency bundle is in its life cycle. */
export type FrequencyBundleStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a frequency bundle and its current status. */
export class FrequencyBundle {
  code: string;
  name: string;
  threshold: number;
  utmSource: string;
  unit: string;
  description: string;
  amount: number;
  version: number;
  priority: number;
  status: FrequencyBundleStatus;

  constructor(
    code: string,
    name: string,
    threshold: number,
    utmSource: string,
    unit: string,
    description: string,
    amount: number,
    version: number,
    priority: number,
    status: FrequencyBundleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.threshold = threshold;
    this.utmSource = utmSource;
    this.unit = unit;
    this.description = description;
    this.amount = amount;
    this.version = version;
    this.priority = priority;
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

  canMoveTo(next: FrequencyBundleStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "revoked" || next === "expired";
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: FrequencyBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`frequency bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  netVolume(): number {
    return Math.round((this.amount + this.threshold) * 100) / 100;
  }

  copy(): FrequencyBundle {
    return new FrequencyBundle(
      this.code,
      this.name,
      this.threshold,
      this.utmSource,
      this.unit,
      this.description,
      this.amount,
      this.version,
      this.priority,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a frequency bundle in status requested. */
export function newFrequencyBundle(code: string, name: string): FrequencyBundle {
  return new FrequencyBundle(code, name, 0, "", "", "", 0, 0, 0, "requested");
}
