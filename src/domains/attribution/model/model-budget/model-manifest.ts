import * as text from "../../../../kit/text.js";

/** Where a model manifest is in its life cycle. */
export type ModelManifestStatus = "created" | "validated" | "published" | "retired";

/** A model manifest. Its code is unique within a tenant. */
export class ModelManifest {
  code: string;
  label: string;
  active: boolean;
  budget: number;
  conversionRate: number;
  description: string;
  channel: string;
  locale: string;
  cost: number;
  windowDays: number;
  status: ModelManifestStatus;

  constructor(
    code: string,
    label: string,
    active: boolean,
    budget: number,
    conversionRate: number,
    description: string,
    channel: string,
    locale: string,
    cost: number,
    windowDays: number,
    status: ModelManifestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.active = active;
    this.budget = budget;
    this.conversionRate = conversionRate;
    this.description = description;
    this.channel = channel;
    this.locale = locale;
    this.cost = cost;
    this.windowDays = windowDays;
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

  canMoveTo(next: ModelManifestStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
            return true;
        }
        return false;
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: ModelManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`model manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  adjustedValue(): number {
    return Math.round((this.conversionRate + this.budget) * 100) / 100;
  }

  copy(): ModelManifest {
    return new ModelManifest(
      this.code,
      this.label,
      this.active,
      this.budget,
      this.conversionRate,
      this.description,
      this.channel,
      this.locale,
      this.cost,
      this.windowDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a model manifest in status created. */
export function newModelManifest(code: string, label: string): ModelManifest {
  return new ModelManifest(code, label, false, 0, 0, "", "", "", 0, 0, "created");
}
