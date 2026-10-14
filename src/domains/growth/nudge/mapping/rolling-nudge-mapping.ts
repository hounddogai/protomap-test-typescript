/**
 * The rolling nudge mapping records of growth's nudge work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a rolling nudge mapping is in its life cycle. */
export type RollingNudgeMappingStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a rolling nudge mapping and its current status. */
export class RollingNudgeMapping {
  code: string;
  title: string;
  unit: string;
  channel: string;
  country: string;
  quantity: number;
  status: RollingNudgeMappingStatus;

  constructor(
    code: string,
    title: string,
    unit: string,
    channel: string,
    country: string,
    quantity: number,
    status: RollingNudgeMappingStatus,
  ) {
    this.code = code;
    this.title = title;
    this.unit = unit;
    this.channel = channel;
    this.country = country;
    this.quantity = quantity;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: RollingNudgeMappingStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
            return true;
        }
        return false;
      case "approved":
        return next === "withdrawn";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RollingNudgeMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling nudge mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  measuredValue(): number {
    return this.quantity;
  }

  copy(): RollingNudgeMapping {
    return new RollingNudgeMapping(
      this.code,
      this.title,
      this.unit,
      this.channel,
      this.country,
      this.quantity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a rolling nudge mapping in status proposed. */
export function newRollingNudgeMapping(code: string, title: string): RollingNudgeMapping {
  return new RollingNudgeMapping(code, title, "", "", "", 0, "proposed");
}
