import * as text from "../../../../kit/text.js";

/** Where a default pacing target is in its life cycle. */
export type DefaultPacingTargetStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a default pacing target and its current status. */
export class DefaultPacingTarget {
  code: string;
  label: string;
  attributes: Map<string, string>;
  quantity: number;
  locale: string;
  description: string;
  margin: number;
  channel: string;
  country: string;
  limit: number;
  active: boolean;
  status: DefaultPacingTargetStatus;

  constructor(
    code: string,
    label: string,
    attributes: Map<string, string>,
    quantity: number,
    locale: string,
    description: string,
    margin: number,
    channel: string,
    country: string,
    limit: number,
    active: boolean,
    status: DefaultPacingTargetStatus,
  ) {
    this.code = code;
    this.label = label;
    this.attributes = attributes;
    this.quantity = quantity;
    this.locale = locale;
    this.description = description;
    this.margin = margin;
    this.channel = channel;
    this.country = country;
    this.limit = limit;
    this.active = active;
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

  canMoveTo(next: DefaultPacingTargetStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "in_progress":
          case "completed":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
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

  moveTo(next: DefaultPacingTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default pacing target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"default pacing target"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  projectedExposure(): number {
    return Math.round((this.quantity + this.limit) * 100) / 100;
  }

  copy(): DefaultPacingTarget {
    return new DefaultPacingTarget(
      this.code,
      this.label,
      this.attributes,
      this.quantity,
      this.locale,
      this.description,
      this.margin,
      this.channel,
      this.country,
      this.limit,
      this.active,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a default pacing target in status planned. */
export function newDefaultPacingTarget(code: string, label: string): DefaultPacingTarget {
  return new DefaultPacingTarget(code, label, new Map<string, string>(), 0, "", "", 0, "", "", 0, false, "planned");
}
