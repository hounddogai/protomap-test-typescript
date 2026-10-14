/**
 * The rolling post checkpoint records of social's post work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a rolling post checkpoint is in its life cycle. */
export type RollingPostCheckpointStatus = "created" | "validated" | "published" | "retired";

/** A rolling post checkpoint. Its code is unique within a tenant. */
export class RollingPostCheckpoint {
  code: string;
  name: string;
  externalRef: string;
  archived: boolean;
  discount: number;
  utmSource: string;
  phone: string;
  conversionRate: number;
  locale: string;
  status: RollingPostCheckpointStatus;

  constructor(
    code: string,
    name: string,
    externalRef: string,
    archived: boolean,
    discount: number,
    utmSource: string,
    phone: string,
    conversionRate: number,
    locale: string,
    status: RollingPostCheckpointStatus,
  ) {
    this.code = code;
    this.name = name;
    this.externalRef = externalRef;
    this.archived = archived;
    this.discount = discount;
    this.utmSource = utmSource;
    this.phone = phone;
    this.conversionRate = conversionRate;
    this.locale = locale;
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

  canMoveTo(next: RollingPostCheckpointStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published";
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: RollingPostCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling post checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"rolling post checkpoint"} ${this.code}`;
  }

  projectedValue(): number {
    return Math.round((this.discount + this.conversionRate) * 100) / 100;
  }

  copy(): RollingPostCheckpoint {
    return new RollingPostCheckpoint(
      this.code,
      this.name,
      this.externalRef,
      this.archived,
      this.discount,
      this.utmSource,
      this.phone,
      this.conversionRate,
      this.locale,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a rolling post checkpoint in status created. */
export function newRollingPostCheckpoint(code: string, name: string): RollingPostCheckpoint {
  return new RollingPostCheckpoint(code, name, "", false, 0, "", "", 0, "", "created");
}
