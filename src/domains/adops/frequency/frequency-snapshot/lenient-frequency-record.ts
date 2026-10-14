import * as text from "../../../../kit/text.js";

/** Where a lenient frequency record is in its life cycle. */
export type LenientFrequencyRecordStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A lenient frequency record. Its code is unique within a tenant. */
export class LenientFrequencyRecord {
  code: string;
  label: string;
  locale: string;
  createdAt: number;
  tags: string[];
  source: string;
  ceiling: number;
  frequencyCap: number;
  timezone: string;
  attributes: Map<string, string>;
  status: LenientFrequencyRecordStatus;

  constructor(
    code: string,
    label: string,
    locale: string,
    createdAt: number,
    tags: string[],
    source: string,
    ceiling: number,
    frequencyCap: number,
    timezone: string,
    attributes: Map<string, string>,
    status: LenientFrequencyRecordStatus,
  ) {
    this.code = code;
    this.label = label;
    this.locale = locale;
    this.createdAt = createdAt;
    this.tags = tags;
    this.source = source;
    this.ceiling = ceiling;
    this.frequencyCap = frequencyCap;
    this.timezone = timezone;
    this.attributes = attributes;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: LenientFrequencyRecordStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
          case "ready":
            return true;
        }
        return false;
      case "warming":
        return next === "stopped";
      case "ready":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LenientFrequencyRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient frequency record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  netVolume(): number {
    return Math.round((this.createdAt + this.ceiling) * 100) / 100;
  }

  copy(): LenientFrequencyRecord {
    return new LenientFrequencyRecord(
      this.code,
      this.label,
      this.locale,
      this.createdAt,
      this.tags,
      this.source,
      this.ceiling,
      this.frequencyCap,
      this.timezone,
      this.attributes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a lenient frequency record in status idle. */
export function newLenientFrequencyRecord(code: string, label: string): LenientFrequencyRecord {
  return new LenientFrequencyRecord(code, label, "", 0, [], "", 0, 0, "", new Map<string, string>(), "idle");
}
