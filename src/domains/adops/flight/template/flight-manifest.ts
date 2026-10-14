import * as text from "../../../../kit/text.js";

/** Where a flight manifest is in its life cycle. */
export type FlightManifestStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A flight manifest. Its code is unique within a tenant. */
export class FlightManifest {
  code: string;
  label: string;
  unit: string;
  variant: string;
  graceDays: number;
  windowDays: number;
  clicks: number;
  description: string;
  status: FlightManifestStatus;

  constructor(
    code: string,
    label: string,
    unit: string,
    variant: string,
    graceDays: number,
    windowDays: number,
    clicks: number,
    description: string,
    status: FlightManifestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.unit = unit;
    this.variant = variant;
    this.graceDays = graceDays;
    this.windowDays = windowDays;
    this.clicks = clicks;
    this.description = description;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: FlightManifestStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled" || next === "in_progress";
      case "scheduled":
        return next === "in_progress" || next === "cancelled";
      case "in_progress":
        return next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: FlightManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`flight manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  effectiveVolume(): number {
    return Math.round(this.clicks * this.graceDays * 100) / 100;
  }

  copy(): FlightManifest {
    return new FlightManifest(
      this.code,
      this.label,
      this.unit,
      this.variant,
      this.graceDays,
      this.windowDays,
      this.clicks,
      this.description,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a flight manifest in status planned. */
export function newFlightManifest(code: string, label: string): FlightManifest {
  return new FlightManifest(code, label, "", "", 0, 0, 0, "", "planned");
}
