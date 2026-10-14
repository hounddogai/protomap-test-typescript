import * as text from "../../../../kit/text.js";

/** Where a model adjustment is in its life cycle. */
export type ModelAdjustmentStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A model adjustment as the model team keeps it. */
export class ModelAdjustment {
  code: string;
  label: string;
  locale: string;
  quantity: number;
  timezone: string;
  summary: string;
  country: string;
  status: ModelAdjustmentStatus;

  constructor(
    code: string,
    label: string,
    locale: string,
    quantity: number,
    timezone: string,
    summary: string,
    country: string,
    status: ModelAdjustmentStatus,
  ) {
    this.code = code;
    this.label = label;
    this.locale = locale;
    this.quantity = quantity;
    this.timezone = timezone;
    this.summary = summary;
    this.country = country;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: ModelAdjustmentStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "archived";
      case "in_review":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        return next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: ModelAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`model adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  measuredValue(): number {
    return this.quantity;
  }

  copy(): ModelAdjustment {
    return new ModelAdjustment(
      this.code,
      this.label,
      this.locale,
      this.quantity,
      this.timezone,
      this.summary,
      this.country,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a model adjustment in status open. */
export function newModelAdjustment(code: string, label: string): ModelAdjustment {
  return new ModelAdjustment(code, label, "", 0, "", "", "", "open");
}
