import * as text from "../../../../kit/text.js";

/** Where a weighted fraud check mapping is in its life cycle. */
export type WeightedFraudCheckMappingStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A weighted fraud check mapping as the fraud check team keeps it. */
export class WeightedFraudCheckMapping {
  code: string;
  name: string;
  channel: string;
  utmSource: string;
  margin: number;
  attempts: number;
  status: WeightedFraudCheckMappingStatus;

  constructor(
    code: string,
    name: string,
    channel: string,
    utmSource: string,
    margin: number,
    attempts: number,
    status: WeightedFraudCheckMappingStatus,
  ) {
    this.code = code;
    this.name = name;
    this.channel = channel;
    this.utmSource = utmSource;
    this.margin = margin;
    this.attempts = attempts;
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

  canMoveTo(next: WeightedFraudCheckMappingStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
          case "in_progress":
            return true;
        }
        return false;
      case "scheduled":
        return next === "in_progress" || next === "cancelled";
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WeightedFraudCheckMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted fraud check mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  projectedVolume(): number {
    return Math.round((this.margin - this.attempts) * 100) / 100;
  }

  copy(): WeightedFraudCheckMapping {
    return new WeightedFraudCheckMapping(
      this.code,
      this.name,
      this.channel,
      this.utmSource,
      this.margin,
      this.attempts,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a weighted fraud check mapping in status planned. */
export function newWeightedFraudCheckMapping(code: string, name: string): WeightedFraudCheckMapping {
  return new WeightedFraudCheckMapping(code, name, "", "", 0, 0, "planned");
}
