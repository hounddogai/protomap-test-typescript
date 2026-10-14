/**
 * The weighted mention cycle records of social's mention work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a weighted mention cycle is in its life cycle. */
export type WeightedMentionCycleStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A weighted mention cycle as the mention team keeps it. */
export class WeightedMentionCycle {
  code: string;
  label: string;
  source: string;
  utmSource: string;
  channel: string;
  locale: string;
  threshold: number;
  segment: string;
  summary: string;
  archived: boolean;
  status: WeightedMentionCycleStatus;

  constructor(
    code: string,
    label: string,
    source: string,
    utmSource: string,
    channel: string,
    locale: string,
    threshold: number,
    segment: string,
    summary: string,
    archived: boolean,
    status: WeightedMentionCycleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.source = source;
    this.utmSource = utmSource;
    this.channel = channel;
    this.locale = locale;
    this.threshold = threshold;
    this.segment = segment;
    this.summary = summary;
    this.archived = archived;
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

  canMoveTo(next: WeightedMentionCycleStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: WeightedMentionCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted mention cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  measuredValue(): number {
    return this.threshold;
  }

  copy(): WeightedMentionCycle {
    return new WeightedMentionCycle(
      this.code,
      this.label,
      this.source,
      this.utmSource,
      this.channel,
      this.locale,
      this.threshold,
      this.segment,
      this.summary,
      this.archived,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a weighted mention cycle in status proposed. */
export function newWeightedMentionCycle(code: string, label: string): WeightedMentionCycle {
  return new WeightedMentionCycle(code, label, "", "", "", "", 0, "", "", false, "proposed");
}
