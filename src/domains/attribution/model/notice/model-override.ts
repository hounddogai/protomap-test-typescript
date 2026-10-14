import * as text from "../../../../kit/text.js";

/** Where a model override is in its life cycle. */
export type ModelOverrideStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A model override as the model team keeps it. */
export class ModelOverride {
  code: string;
  title: string;
  attempts: number;
  active: boolean;
  utmSource: string;
  archived: boolean;
  amount: number;
  durationMinutes: number;
  status: ModelOverrideStatus;

  constructor(
    code: string,
    title: string,
    attempts: number,
    active: boolean,
    utmSource: string,
    archived: boolean,
    amount: number,
    durationMinutes: number,
    status: ModelOverrideStatus,
  ) {
    this.code = code;
    this.title = title;
    this.attempts = attempts;
    this.active = active;
    this.utmSource = utmSource;
    this.archived = archived;
    this.amount = amount;
    this.durationMinutes = durationMinutes;
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

  canMoveTo(next: ModelOverrideStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "withdrawn";
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: ModelOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`model override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"model override"} ${this.code}`;
  }

  weightedVolume(): number {
    return Math.round((this.attempts - this.durationMinutes) * 100) / 100;
  }

  copy(): ModelOverride {
    return new ModelOverride(
      this.code,
      this.title,
      this.attempts,
      this.active,
      this.utmSource,
      this.archived,
      this.amount,
      this.durationMinutes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a model override in status proposed. */
export function newModelOverride(code: string, title: string): ModelOverride {
  return new ModelOverride(code, title, 0, false, "", false, 0, 0, "proposed");
}
