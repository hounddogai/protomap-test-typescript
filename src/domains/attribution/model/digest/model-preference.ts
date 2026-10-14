import * as text from "../../../../kit/text.js";

/** Where a model preference is in its life cycle. */
export type ModelPreferenceStatus = "created" | "validated" | "published" | "retired";

/** A model preference as the model team keeps it. */
export class ModelPreference {
  code: string;
  name: string;
  maximum: number;
  reviewer: string;
  channel: string;
  floorValue: number;
  timezone: string;
  status: ModelPreferenceStatus;

  constructor(
    code: string,
    name: string,
    maximum: number,
    reviewer: string,
    channel: string,
    floorValue: number,
    timezone: string,
    status: ModelPreferenceStatus,
  ) {
    this.code = code;
    this.name = name;
    this.maximum = maximum;
    this.reviewer = reviewer;
    this.channel = channel;
    this.floorValue = floorValue;
    this.timezone = timezone;
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

  canMoveTo(next: ModelPreferenceStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ModelPreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`model preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  projectedTotal(): number {
    return Math.round(this.maximum * this.floorValue * 100) / 100;
  }

  copy(): ModelPreference {
    return new ModelPreference(
      this.code,
      this.name,
      this.maximum,
      this.reviewer,
      this.channel,
      this.floorValue,
      this.timezone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a model preference in status created. */
export function newModelPreference(code: string, name: string): ModelPreference {
  return new ModelPreference(code, name, 0, "", "", 0, "", "created");
}
