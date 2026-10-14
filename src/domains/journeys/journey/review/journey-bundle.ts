import * as text from "../../../../kit/text.js";

/** Where a journey bundle is in its life cycle. */
export type JourneyBundleStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A journey bundle. Its code is unique within a tenant. */
export class JourneyBundle {
  code: string;
  name: string;
  capacity: number;
  variant: string;
  utmSource: string;
  unit: string;
  status: JourneyBundleStatus;

  constructor(
    code: string,
    name: string,
    capacity: number,
    variant: string,
    utmSource: string,
    unit: string,
    status: JourneyBundleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.capacity = capacity;
    this.variant = variant;
    this.utmSource = utmSource;
    this.unit = unit;
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

  canMoveTo(next: JourneyBundleStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        return next === "ready" || next === "stopped";
      case "ready":
        return next === "draining";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: JourneyBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`journey bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  measuredValue(): number {
    return this.capacity;
  }

  copy(): JourneyBundle {
    return new JourneyBundle(this.code, this.name, this.capacity, this.variant, this.utmSource, this.unit, this.status);
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a journey bundle in status idle. */
export function newJourneyBundle(code: string, name: string): JourneyBundle {
  return new JourneyBundle(code, name, 0, "", "", "", "idle");
}
