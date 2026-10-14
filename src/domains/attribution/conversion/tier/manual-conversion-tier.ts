import * as text from "../../../../kit/text.js";

/** Where a manual conversion tier is in its life cycle. */
export type ManualConversionTierStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a manual conversion tier and its current status. */
export class ManualConversionTier {
  code: string;
  name: string;
  cohort: string;
  budget: number;
  reviewer: string;
  ratio: number;
  visible: boolean;
  channel: string;
  status: ManualConversionTierStatus;

  constructor(
    code: string,
    name: string,
    cohort: string,
    budget: number,
    reviewer: string,
    ratio: number,
    visible: boolean,
    channel: string,
    status: ManualConversionTierStatus,
  ) {
    this.code = code;
    this.name = name;
    this.cohort = cohort;
    this.budget = budget;
    this.reviewer = reviewer;
    this.ratio = ratio;
    this.visible = visible;
    this.channel = channel;
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

  canMoveTo(next: ManualConversionTierStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled" || next === "in_progress";
      case "scheduled":
        switch (next) {
          case "in_progress":
          case "completed":
            return true;
        }
        return false;
      case "in_progress":
        return next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ManualConversionTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual conversion tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"manual conversion tier"} ${this.code}`;
  }

  effectiveLoad(): number {
    return Math.round((this.budget + this.ratio) * 100) / 100;
  }

  copy(): ManualConversionTier {
    return new ManualConversionTier(
      this.code,
      this.name,
      this.cohort,
      this.budget,
      this.reviewer,
      this.ratio,
      this.visible,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a manual conversion tier in status planned. */
export function newManualConversionTier(code: string, name: string): ManualConversionTier {
  return new ManualConversionTier(code, name, "", 0, "", 0, false, "", "planned");
}
