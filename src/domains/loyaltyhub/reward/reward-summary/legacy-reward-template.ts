import * as text from "../../../../kit/text.js";

/** Where a legacy reward template is in its life cycle. */
export type LegacyRewardTemplateStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A legacy reward template as the reward team keeps it. */
export class LegacyRewardTemplate {
  code: string;
  title: string;
  pinned: boolean;
  attributes: Map<string, string>;
  timezone: string;
  archived: boolean;
  minimum: number;
  journeyId: string;
  threshold: number;
  locale: string;
  summary: string;
  status: LegacyRewardTemplateStatus;

  constructor(
    code: string,
    title: string,
    pinned: boolean,
    attributes: Map<string, string>,
    timezone: string,
    archived: boolean,
    minimum: number,
    journeyId: string,
    threshold: number,
    locale: string,
    summary: string,
    status: LegacyRewardTemplateStatus,
  ) {
    this.code = code;
    this.title = title;
    this.pinned = pinned;
    this.attributes = attributes;
    this.timezone = timezone;
    this.archived = archived;
    this.minimum = minimum;
    this.journeyId = journeyId;
    this.threshold = threshold;
    this.locale = locale;
    this.summary = summary;
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

  canMoveTo(next: LegacyRewardTemplateStatus): boolean {
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
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
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

  moveTo(next: LegacyRewardTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy reward template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  projectedExposure(): number {
    return Math.round((this.threshold + this.minimum) * 100) / 100;
  }

  copy(): LegacyRewardTemplate {
    return new LegacyRewardTemplate(
      this.code,
      this.title,
      this.pinned,
      this.attributes,
      this.timezone,
      this.archived,
      this.minimum,
      this.journeyId,
      this.threshold,
      this.locale,
      this.summary,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a legacy reward template in status planned. */
export function newLegacyRewardTemplate(code: string, title: string): LegacyRewardTemplate {
  return new LegacyRewardTemplate(
    code,
    title,
    false,
    new Map<string, string>(),
    "",
    false,
    0,
    "",
    0,
    "",
    "",
    "planned",
  );
}
