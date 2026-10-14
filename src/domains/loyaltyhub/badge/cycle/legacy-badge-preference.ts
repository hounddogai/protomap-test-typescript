import * as text from "../../../../kit/text.js";

/** Where a legacy badge preference is in its life cycle. */
export type LegacyBadgePreferenceStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a legacy badge preference and its current status. */
export class LegacyBadgePreference {
  code: string;
  name: string;
  margin: number;
  variant: string;
  amount: number;
  priority: number;
  durationMinutes: number;
  status: LegacyBadgePreferenceStatus;

  constructor(
    code: string,
    name: string,
    margin: number,
    variant: string,
    amount: number,
    priority: number,
    durationMinutes: number,
    status: LegacyBadgePreferenceStatus,
  ) {
    this.code = code;
    this.name = name;
    this.margin = margin;
    this.variant = variant;
    this.amount = amount;
    this.priority = priority;
    this.durationMinutes = durationMinutes;
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

  canMoveTo(next: LegacyBadgePreferenceStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "in_progress":
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        return next === "completed" || next === "cancelled";
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LegacyBadgePreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy badge preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  netLoad(): number {
    return Math.round(this.durationMinutes * this.margin * 100) / 100;
  }

  copy(): LegacyBadgePreference {
    return new LegacyBadgePreference(
      this.code,
      this.name,
      this.margin,
      this.variant,
      this.amount,
      this.priority,
      this.durationMinutes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a legacy badge preference in status planned. */
export function newLegacyBadgePreference(code: string, name: string): LegacyBadgePreference {
  return new LegacyBadgePreference(code, name, 0, "", 0, 0, 0, "planned");
}
