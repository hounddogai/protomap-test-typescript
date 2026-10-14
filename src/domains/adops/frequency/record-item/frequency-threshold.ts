import * as text from "../../../../kit/text.js";

/** Where a frequency threshold is in its life cycle. */
export type FrequencyThresholdStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One frequency threshold, with what the planners need to act on it. */
export class FrequencyThreshold {
  code: string;
  label: string;
  source: string;
  visible: boolean;
  reviewer: string;
  category: string;
  description: string;
  campaignRef: string;
  expiresAt: number;
  tags: string[];
  externalRef: string;
  status: FrequencyThresholdStatus;

  constructor(
    code: string,
    label: string,
    source: string,
    visible: boolean,
    reviewer: string,
    category: string,
    description: string,
    campaignRef: string,
    expiresAt: number,
    tags: string[],
    externalRef: string,
    status: FrequencyThresholdStatus,
  ) {
    this.code = code;
    this.label = label;
    this.source = source;
    this.visible = visible;
    this.reviewer = reviewer;
    this.category = category;
    this.description = description;
    this.campaignRef = campaignRef;
    this.expiresAt = expiresAt;
    this.tags = tags;
    this.externalRef = externalRef;
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

  canMoveTo(next: FrequencyThresholdStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "rejected";
      case "approved":
        return next === "rejected";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FrequencyThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`frequency threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  measuredValue(): number {
    return this.expiresAt;
  }

  copy(): FrequencyThreshold {
    return new FrequencyThreshold(
      this.code,
      this.label,
      this.source,
      this.visible,
      this.reviewer,
      this.category,
      this.description,
      this.campaignRef,
      this.expiresAt,
      this.tags,
      this.externalRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a frequency threshold in status proposed. */
export function newFrequencyThreshold(code: string, label: string): FrequencyThreshold {
  return new FrequencyThreshold(code, label, "", false, "", "", "", "", 0, [], "", "proposed");
}
