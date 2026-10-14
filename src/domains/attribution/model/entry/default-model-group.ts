import * as text from "../../../../kit/text.js";

/** Where a default model group is in its life cycle. */
export type DefaultModelGroupStatus = "requested" | "granted" | "revoked" | "expired";

/** A default model group. Its code is unique within a tenant. */
export class DefaultModelGroup {
  code: string;
  title: string;
  floorValue: number;
  conversionRate: number;
  durationMinutes: number;
  status: DefaultModelGroupStatus;

  constructor(
    code: string,
    title: string,
    floorValue: number,
    conversionRate: number,
    durationMinutes: number,
    status: DefaultModelGroupStatus,
  ) {
    this.code = code;
    this.title = title;
    this.floorValue = floorValue;
    this.conversionRate = conversionRate;
    this.durationMinutes = durationMinutes;
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

  canMoveTo(next: DefaultModelGroupStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "revoked";
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: DefaultModelGroupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default model group ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  effectiveExposure(): number {
    return Math.round((this.conversionRate + this.floorValue) * 100) / 100;
  }

  copy(): DefaultModelGroup {
    return new DefaultModelGroup(
      this.code,
      this.title,
      this.floorValue,
      this.conversionRate,
      this.durationMinutes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a default model group in status requested. */
export function newDefaultModelGroup(code: string, title: string): DefaultModelGroup {
  return new DefaultModelGroup(code, title, 0, 0, 0, "requested");
}
