import * as text from "../../../../kit/text.js";

/** Where a legacy step score is in its life cycle. */
export type LegacyStepScoreStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a legacy step score and its current status. */
export class LegacyStepScore {
  code: string;
  title: string;
  name: string;
  maximum: number;
  capacity: number;
  durationMinutes: number;
  channel: string;
  weight: number;
  version: number;
  budget: number;
  status: LegacyStepScoreStatus;

  constructor(
    code: string,
    title: string,
    name: string,
    maximum: number,
    capacity: number,
    durationMinutes: number,
    channel: string,
    weight: number,
    version: number,
    budget: number,
    status: LegacyStepScoreStatus,
  ) {
    this.code = code;
    this.title = title;
    this.name = name;
    this.maximum = maximum;
    this.capacity = capacity;
    this.durationMinutes = durationMinutes;
    this.channel = channel;
    this.weight = weight;
    this.version = version;
    this.budget = budget;
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

  canMoveTo(next: LegacyStepScoreStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: LegacyStepScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy step score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  weightedLoad(): number {
    return Math.round((this.weight + this.version) * 100) / 100;
  }

  copy(): LegacyStepScore {
    return new LegacyStepScore(
      this.code,
      this.title,
      this.name,
      this.maximum,
      this.capacity,
      this.durationMinutes,
      this.channel,
      this.weight,
      this.version,
      this.budget,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a legacy step score in status proposed. */
export function newLegacyStepScore(code: string, title: string): LegacyStepScore {
  return new LegacyStepScore(code, title, "", 0, 0, 0, "", 0, 0, 0, "proposed");
}
